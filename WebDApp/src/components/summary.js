import { ethers } from 'ethers';
import React, { Component } from 'react';
import autoBind from 'react-autobind';
import Web3 from 'web3';
import { abiERC20 } from '../contracts/erc20';
import { abi } from '../contracts/charity';
import ContextModule from '../utils/contextModule';
import { rpcs } from '../utils/constants';

function sortByKey(array, key) {
    const temp = array
    return temp.sort((a, b) => {
        var x = parseFloat(a[key]);
        var y = parseFloat(b[key]);
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
}

function epsilonRound(num, zeros = 10000) {
    return Math.round((num + Number.EPSILON) * zeros) / zeros
}

async function fetchAsyncBalance(url) {
    return new Promise((resolve, reject) => {
        fetch(url, { method: 'GET', redirect: 'follow' })
            .then(result => result.text())
            .then((response) => {
                let temp = JSON.parse(response)
                for (let i = 0; i < temp.data.items.length; i++) {
                    if (temp.data.items[i].contract_ticker_symbol === "MATIC") {
                        resolve(temp.data.items[i].balance)
                    }
                }
                resolve(0)
            })
            .catch((error) => {
                console.log(error);
            })
    })
}

class Summary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: "0",
            charity: "",
            donors: [],
            donnors: [],
            tokenPrices: [],
            tokenBalances: []
        }
        autoBind(this);
        this.provider = new ethers.providers.JsonRpcProvider(`https://moonbeam-mainnet.gateway.pokt.network/v1/lb/${process.env.REACT_APP_POCKET_API}`)
        this.web3 = new Web3(`https://moonbeam-mainnet.gateway.pokt.network/v1/lb/${process.env.REACT_APP_POCKET_API}`)
        this.contract = null
        this.counter = 0
        this.fetchBalances = null
        //this.messagesEndRef = React.createRef()
    }

    static contextType = ContextModule;

    async prices() {
        return new Promise((resolve, reject) => {
            var myHeaders = new Headers();
            myHeaders.append("accept", "application/json");
            myHeaders.append("Cookie", "__cf_bm=j5teDjtwXGaECcrLzA_QyFeQtA3_B_nKf.j8n7zM5Jo-1676352219-0-AcwBwlE02ggR0fA4mBmIfhzZ/N7uSEhEBYVu+CWqlqMtk6KM37d/RT6aJuGsgy+GnKK1iuarNAIhkj3jkQCoooI=");

            var requestOptions = {
                method: 'GET',
                headers: myHeaders,
                redirect: 'follow'
            };

            fetch("https://api.coingecko.com/api/v3/simple/price?ids=acala,acestarter,acala-dollar,bifrost-native-coin,polkadot,moonbeam,interbtc,interlay,parallel-finance,pha,ring,tether&vs_currencies=usd", requestOptions)
                .then(response => response.text())
                .then(result => resolve(JSON.parse(result)))
                .catch(error => console.log('error', error));
        })
    }

    async contractData() {
        this.contract = new this.web3.eth.Contract(abi(), this.context.value.contractAddress)
        let temp = await this.contract.methods.counter().call()
        let charity = await this.contract.methods.charity().call()
        this.setState({
            charity
        })
        if (parseInt(this.counter) < parseInt(temp)) {
            this.counter = temp
            let donors = new Array(parseInt(this.counter)).fill(null)
            donors = await Promise.all(
                donors.map(async (item, index) => {
                    let ret = await this.contract.methods.Donors(index, 0).call()
                    ret = {
                        amount: ret.amount,
                        address: ret.donor
                    }
                    return ret
                })
            )
            this.setState({
                donors: donors,
                donnors: donors[0]
            })
        }
    }

    async getBalanceToken(address, tokenAddress) {
        return new Promise(async (resolve, reject) => {
            const contract = new ethers.Contract(tokenAddress, abiERC20, this.provider);
            let res = await contract.balanceOf(address)
            let decimals = await contract.decimals()
            resolve(res / (Math.pow(10, decimals)))
        })
    }

    async getBalances() {
        let tokenBalances = await Promise.all(Object.keys(rpcs).map((item) => item === "GLMR" ? this.provider.getBalance(this.context.value.charity) : this.getBalanceToken(this.context.value.charity, rpcs[item].contract)))
        tokenBalances = tokenBalances.map((item) => parseFloat(item.toString()))
        tokenBalances[Object.keys(rpcs).indexOf("GLMR")] = ethers.utils.formatEther(tokenBalances[Object.keys(rpcs).indexOf("GLMR")].toString())
        return tokenBalances
    }

    async componentDidMount() {
        let tokenBalances = await this.getBalances()
        let tokenPrices = await this.prices()
        tokenPrices = Object.keys(rpcs).map((item, index) =>
            tokenPrices[rpcs[item].gecko].usd
        )
        this.setState({
            tokenBalances,
            tokenPrices
        })

        this.balanceCheck = setInterval(async () => {
            try{
                tokenBalances = await this.getBalances()
                this.setState({
                    tokenBalances
                })
            }
            catch(error){
                console.log("Error Reading Balances")
            }
        }, 10000);
    }

    componentWillUnmount() {
        clearInterval(this.balanceCheck)
    }

    render() {
        return (
            <div style={{ position: "absolute", top: "6%", left: "0px", height: "94%", width: "20%", backgroundColor: "#18181b", display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", borderRight: "1px solid", borderTop: "1px solid" }}>
                <div style={{ fontSize: 18, textAlign: "center", height: "20%", marginTop: "20px" }}>
                    <span style={{ cursor: "pointer", color: "white" }} onClick={() => window.open(`https://moonscan.io/address/${this.state.charity}`, "_blank")}>
                        Charity:
                        <br />
                        {this.context.value.charity.substring(0, 4)}
                        ...
                        {this.context.value.charity.substring(this.context.value.charity.length - 4, this.context.value.charity.length)}
                    </span>
                    <br />
                    <span style={{ color: "white" }}>
                        <span style={{ fontWeight: "bold", fontSize: 30 }}>
                            {
                                this.state.tokenPrices.length > 0 &&
                                epsilonRound(this.state.tokenPrices.reduce((partialSum, a, index) => partialSum + a * this.state.tokenBalances[index], 0)).toString()

                            }
                            {" "}USD
                        </span>
                        <br />
                        Raised
                        <br />
                    </span>
                </div>
                <div style={{ borderBottom: "1px solid", width: window.innerWidth * 0.2 }} />
                <div className='hideScrollbar' style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", color: "white", fontSize: 20, textAlign: "center", overflowY: "scroll", width: "100%", height: "80%" }}>
                    <div style={{ marginTop: window.innerHeight * 0.25 }} />
                    {
                        this.state.tokenPrices.length > 0 &&
                        Object.keys(rpcs).map((item, index) =>
                            <div key={"elementsd" + index}>
                                {rpcs[item].name} [{rpcs[item].symbol}]
                                <br />
                                {epsilonRound(parseFloat(this.state.tokenBalances[index])).toString()} {<img src={rpcs[item].icon} style={{ borderRadius: "20px", width: "20px", height: "20px" }} />}
                            </div>
                        )
                    }
                    <div style={{ marginTop: window.innerHeight * 0.03 }} />
                </div>
            </div >
        );
    }
}

export default Summary;