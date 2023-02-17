import React, { Component } from 'react';
import { Client } from '@xmtp/xmtp-js'
import { Button, Input } from 'reactstrap';
import autoBind from 'react-autobind';
import { abi } from '../contracts/charity';
import { ethers } from 'ethers'
import Web3 from 'web3';
import ContextModule from '../utils/contextModule';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import notif from "../assets/notification.mp3"
import { init } from '@moonbeam-network/xcm-sdk';
import { rpcs } from '../utils/constants';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { toDecimal } from '@moonbeam-network/xcm-utils';
import { web3FromAddress } from '@polkadot/extension-dapp';

function getUniqueListBy(arr, key) {
    return [...new Map(arr.map(item => [item[key], item])).values()]
}

function epsilonRound(num, zeros = 10000) {
    return Math.round((num + Number.EPSILON) * zeros) / zeros
}

class Chat extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ready: false,
            dm: false,
            to: "",
            amount: "0",
            message: "",
            tokenSelected: {},
            tokenBalance: 0,
            tokenMin: 0,
            tokenBalanceLoading: false,
            history: [{
                // Seed Value to Filter
                address: "",
                message: ""
            }],
            historyDM: [{
                // Seed Value to Filter
                address: "",
                message: ""
            }]
        }
        autoBind(this);
        this.messagesEndRef = React.createRef()
        this.web3 = new Web3(window.ethereum)
        this.audio = new Audio(notif);
        this.socket = new WebSocket(process.env.REACT_APP_WSS);
        this.provider = new ethers.providers.JsonRpcProvider(`https://moonbeam-mainnet.gateway.pokt.network/v1/lb/${process.env.REACT_APP_POCKET_API}`)
        this.polkaProvider = null
        this.conversation = null
        this.ready = false
        this.ping = null
    }

    static contextType = ContextModule;

    async componentDidMount() {
        this.connect()
    }

    componentWillUnmount() {
    }

    connect() {
        this.socket.onopen = () => {
            console.log("WebSocket Connected");
            this.setState({
                ready: true
            })
            this.ping = setInterval(() => {
                this.socket.send("ping")
                console.log("ping")
            }, 60000)
        };

        this.socket.onmessage = (message) => {
            if (message.data === "pong") {
                console.log("pong")
            }
            else {
                if (!(JSON.parse(message.data).dm)) {
                    let temp = this.state.history
                    // Filter Duplicates
                    if (
                        this.state.history[this.state.history.length - 1].address !== JSON.parse(message.data).address ||
                        this.state.history[this.state.history.length - 1].message !== JSON.parse(message.data).message
                    ) {
                        temp.push(JSON.parse(message.data))
                        this.messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                    }
                    this.setState({
                        history: temp
                    })
                }
                if (JSON.parse(message.data).dm && this.context.value.address !== "" && this.context.value.address === JSON.parse(message.data).to && !this.state.dm) {
                    let temp = this.context.value.chatNotif
                    temp.push(JSON.parse(message.data))
                    this.context.setValue({
                        chatNotif: temp
                    })
                    this.audio.play()
                }
            }
        };

        this.socket.onclose = (event) => {
            this.setState({
                ready: false
            }, () => setTimeout(() => {
                this.connect()
            }, 5000))
        };

        this.socket.onerror = function (error) {
            console.log(error);
        };

    }

    async sendMessage() {
        let tempMes = this.state.message
        console.log(this.context.value.address ?? this.context.value.addressPolkadot)
        this.socket.send(JSON.stringify({
            address: this.context.value.address ?? this.context.value.addressPolkadot,
            message: tempMes,
            amount: "0",
            dm: false
        }))
        this.setState({
            to: "",
            dm: false,
            message: "",
            amount: "0"
        })
    }


    async sendMessageMoney() {
        return new Promise(async (resolve, reject) => {
            try {
                if (this.state.tokenSelected.symbol === "GLMR") {

                    const tx = {
                        to: this.context.value.charity,
                        value: ethers.utils.parseUnits(this.state.amount.toString(), "ether"),
                    }
                    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
                    const signer = provider.getSigner();
                    const receipt = await signer.sendTransaction(tx);
                    resolve("ok")
                }
                else {
                    const injector = await web3FromAddress(this.context.value.addressPolkadot);
                    const { moonbeam } = init({
                        polkadotSigner: injector.signer
                    })
                    const { from } = moonbeam.deposit(this.state.tokenSelected.symbol);
                    const { send, asset } = await from(this.state.tokenSelected.key).get(
                        this.context.value.charity,
                        this.context.value.addressPolkadot,
                    );
                    send(((this.state.amount) * Math.pow(10, asset.decimals)).toString(), (event) => {
                        if (event.status === 'Success') resolve("ok")
                    })
                }
            }
            catch {
                this.setState({
                    ready: true,
                    amount: 0
                }, () => resolve("reject"))
            }
        })
    }

    async sendMessageXMTP() {
        let tempMes = this.state.message
        this.socket.send(JSON.stringify({
            address: this.context.value.address,
            to: this.state.to,
            message: tempMes,
            dm: true
        }))
        this.conversation.send(JSON.stringify({
            address: this.context.value.address,
            message: tempMes
        }))
        this.setState({
            message: "",
        })
    }

    async startDM(address) {
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any")
        const xmtp = await Client.create(provider.getSigner())
        // It is very important that the Address is correctly written with ChecksumAddress, otherwise XMTP will not work.
        this.conversation = await xmtp.conversations.newConversation(this.web3.utils.toChecksumAddress(address))
        const messages = await this.conversation.messages()
        let tempMessages = []
        messages.forEach((item, index) => {
            try {

                tempMessages.push(JSON.parse(item.content))
            }
            catch {
                //
            }
        })
        this.setState({
            historyDM: tempMessages
        })
        // Listen for new messages in the this.conversation
        const account = this.web3.utils.toChecksumAddress(address)
        for await (const message of await this.conversation.streamMessages()) {
            if (account !== this.web3.utils.toChecksumAddress(address)) {
                console.log("Break:" + account)
                break
            }
            let historyDM = this.state.historyDM
            if (historyDM[historyDM.length - 1].message !== JSON.parse(message.content).message) {
                historyDM.push({
                    address: message.senderAddress,
                    message: JSON.parse(message.content).message
                })
                this.setState({
                    historyDM
                })
            }
        }
    }

    render() {
        return (
            <div style={{ position: "absolute", top: "6%", right: "0px", height: "94%", width: "20%", backgroundColor: "#18181b", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", borderLeft: "1px solid", borderTop: "1px solid" }}>
                <div style={{ color: "white", padding: "3% 0% 3% 0%", borderBottom: "1px solid #555", width: "100%", textAlign: "center" }}>
                    {
                        this.state.dm ? "DM Chat" : "Stream Chat"
                    }
                    &nbsp;&nbsp;&nbsp;
                    <span style={{ color: (this.state.ready) ? "green" : "red" }}>⦿</span>
                    &nbsp;&nbsp;&nbsp;
                    <SwapHorizIcon onClick={() => {
                        this.setState({
                            dm: !this.state.dm,
                            to: "",
                            historyDM: [{
                                // Seed Value to Filter
                                address: "",
                                message: ""
                            }]
                        })
                    }} />
                </div>
                {
                    this.state.dm ?
                        <>
                            {
                                (this.context.value.addressPolkadot !== "" || this.context.value.address !== "") && this.state.to === "" &&
                                <>
                                    <div style={{ height: "100%", width: "100%", overflowY: "scroll", borderBottom: "1px solid #555" }}>
                                        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                                            {
                                                getUniqueListBy(this.state.history, 'address').map((item, index) => {
                                                    return (
                                                        <div key={"Messages" + index} style={{ margin: "10px", width: "100%", textAlign: "center" }}>
                                                            {
                                                                item.address !== "" &&
                                                                <Button color="warning" onClick={() => {
                                                                    this.setState({
                                                                        to: item.address
                                                                    }, () => this.startDM(item.address))
                                                                }}>
                                                                    <span>
                                                                        DM to{" "}
                                                                        {item.address.substring(0, 10)}
                                                                        ...
                                                                        {item.address.substring(item.address.length - 8, item.address.length)}
                                                                    </span>
                                                                </Button>
                                                            }
                                                        </div>

                                                    )
                                                })
                                            }
                                        </div>
                                    </div>
                                </>
                            }
                            {
                                (this.context.value.addressPolkadot !== "" || this.context.value.address !== "") && this.state.to !== "" &&
                                <>
                                    <div style={{ height: "100%", width: "100%", overflowY: "scroll", borderBottom: "1px solid #555" }}>
                                        {
                                            this.state.historyDM.map((item, index) => {
                                                return (
                                                    <div key={"Message" + index} style={{ margin: "0px 10px 0px" }}>
                                                        {
                                                            item.address !== "" &&
                                                            <>
                                                                <span style={{ cursor: "pointer", color: `#${item.address.substring(0, 2) === "0x" ? item.address.substring(2, 8) : Buffer.from(this.context.value.addressPolkadot).toString('hex')}` }} onClick={() => window.open(`https://moonscan.io/address/${item.address}`, "_blank")}>
                                                                    {item.address.substring(0, 4)}
                                                                    ...
                                                                    {item.address.substring(item.address.length - 4, item.address.length)}
                                                                </span>
                                                                <span style={{ color: "white", wordWrap: "break-word" }}>
                                                                    &nbsp;:&nbsp;{item.message}{"\n"}
                                                                </span></>
                                                        }
                                                    </div>

                                                )
                                            })
                                        }
                                        <div ref={this.messagesEndRef} />
                                    </div>
                                    <div style={{ color: "white", padding: "3% 0% 3% 0%", borderBottom: "1px solid #555", width: "100%", textAlign: "center", display: "flex", flexDirection: "row" }}>
                                        <Input
                                            value={this.state.message}
                                            placeholder={"Send Message"}
                                            style={{ width: "80%", marginLeft: "5%", marginRight: "2%" }}
                                            onChange={(e) => this.setState({ message: e.target.value })}
                                            onKeyDown={(e) => { e.key === "Enter" && this.sendMessageXMTP() }}
                                        />
                                        <Button color="warning" style={{ marginRight: "5%" }} onClick={() => {
                                            this.sendMessageXMTP()
                                        }}>
                                            Send
                                        </Button>
                                    </div>
                                </>
                            }
                        </>
                        :
                        <>
                            <div style={{ height: "100%", width: "100%", overflowY: "scroll", borderBottom: "1px solid #555" }}>
                                {
                                    this.state.history.map((item, index) => {
                                        return (
                                            <div key={"Message" + index} style={{ margin: "0px 10px 0px" }}>
                                                {
                                                    item.address !== "" &&
                                                    <>
                                                        <span style={{ cursor: "pointer", color: `#${item.address.substring(0, 2) === "0x" ? item.address.substring(2, 8) : Buffer.from(this.context.value.addressPolkadot).toString('hex')}` }} onClick={() => window.open(`https://moonscan.io/address/${item.address}`, "_blank")}>
                                                            {item.address.substring(0, 4)}
                                                            ...
                                                            {item.address.substring(item.address.length - 4, item.address.length)}
                                                        </span>
                                                        <span style={{ color: "white", wordWrap: "break-word" }}>
                                                            &nbsp;:&nbsp;{item.message}{"\n"}
                                                        </span></>
                                                }
                                            </div>

                                        )
                                    })
                                }
                                <div ref={this.messagesEndRef} />
                            </div>
                            {
                                (this.context.value.addressPolkadot !== "" || this.context.value.address !== "") &&
                                <div style={{ color: "white", padding: "3% 0% 3% 0%", borderBottom: "1px solid #555", width: "100%", textAlign: "center" }}>
                                    <div style={{ padding: "6px 0px", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                                        <Input
                                            value={this.state.message}
                                            placeholder={"Send Message"}
                                            style={{ width: "90%" }}
                                            onChange={(e) => this.setState({ message: e.target.value })}
                                            onKeyDown={(e) => { e.key === "Enter" && this.sendMessage() }}
                                        />
                                    </div>
                                    <div style={{ backgroundColor: "gray", height: "1px", margin: "5px 0px" }} />
                                    <div style={{ paddingBottom: "10px", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                                        Token Balance: {this.state.tokenBalanceLoading ? "loading" : epsilonRound(this.state.tokenBalance).toString()}{<br />}{"Min: "}{this.state.tokenBalanceLoading ? "loading" : epsilonRound(this.state.tokenMin).toString()}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <Input type="number" value={this.state.amount} style={{ marginLeft: "5%" }} onChange={(e) =>
                                            this.setState({
                                                amount: e.target.value
                                            })
                                        } />
                                        &nbsp;&nbsp;
                                        <Input onChange={async (e) => {
                                            this.setState({ tokenBalanceLoading: true })
                                            if (e.target.value === "GLMR") {
                                                let tokenBalance = await this.provider.getBalance(this.context.value.address)
                                                tokenBalance = parseFloat(ethers.utils.formatEther(tokenBalance.toString()))
                                                console.log(tokenBalance)
                                                this.setState({
                                                    tokenSelected: rpcs[e.target.value],
                                                    tokenBalance,
                                                    tokenBalanceLoading: false,
                                                })
                                            }
                                            else {
                                                const provider = new WsProvider(rpcs[e.target.value].ws);
                                                const api = await ApiPromise.create({ provider });
                                                let { data: { free: currentFree } } = await api.query.system.account(this.context.value.addressPolkadot);
                                                const injector = await web3FromAddress(this.context.value.addressPolkadot);
                                                const { moonbeam } = init({
                                                    polkadotSigner: injector.signer
                                                })
                                                const { from } = moonbeam.deposit(e.target.value);
                                                const { asset, min } = await from(rpcs[e.target.value].key).get(
                                                    this.context.value.charity,
                                                    this.context.value.addressPolkadot,
                                                );
                                                this.setState({
                                                    tokenSelected: rpcs[e.target.value],
                                                    tokenBalance: parseFloat(currentFree.toString()) * Math.pow(10, -1 * asset.decimals),
                                                    tokenBalanceLoading: false,
                                                    tokenMin: toDecimal(min, asset.decimals)
                                                })
                                            }
                                        }} type='select' defaultValue={"Token"}>
                                            <option disabled value={"Token"}>Token</option>
                                            {
                                                Object.keys(rpcs).map((item) => {
                                                    if (item === "GLMR") {
                                                        return <option disabled={this.context.value.address === ""} value={item} key={"keys" + item}>{item}</option>
                                                    }
                                                    else {
                                                        return <option disabled={this.context.value.addressPolkadot === ""} value={item} key={"keys" + item}>{item}</option>
                                                    }

                                                })
                                            }
                                        </Input>

                                        &nbsp;&nbsp;
                                        <Button color="warning" style={{ marginRight: "5%" }} disabled={!this.state.ready} onClick={async () => {
                                            this.setState({
                                                ready: false
                                            })
                                            await this.sendMessageMoney()
                                            if (this.state.tokenSelected.symbol === "GLMR") {
                                                let tokenBalance = await this.provider.getBalance(this.context.value.address)
                                                tokenBalance = parseFloat(ethers.utils.formatEther(tokenBalance.toString()))
                                                this.setState({
                                                    ready: true,
                                                    tokenBalance,
                                                    amount: 0
                                                })
                                            }
                                            else {
                                                const provider = new WsProvider(this.state.tokenSelected.ws);
                                                const api = await ApiPromise.create({ provider });
                                                let { data: { free: currentFree } } = await api.query.system.account(this.context.value.addressPolkadot);
                                                this.setState({
                                                    ready: true,
                                                    tokenBalance: parseFloat(currentFree.toString()) * Math.pow(10, -1 * 12),
                                                    amount: 0
                                                })
                                            }
                                        }}>
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            }
                        </>
                }
            </div >
        );
    }
}

export default Chat;