import React, { Component } from 'react';
import { Button, Input, Modal, ModalBody, ModalHeader } from 'reactstrap';
import { withCookies } from 'react-cookie';
import logo from "../assets/logo.png"
import ContextModule from '../utils/contextModule';
import reactAutobind from 'react-autobind';
import axios from 'axios';
import NFT from "../assets/nft-bn.png"

class Header extends Component {

    constructor(props) {
        super(props);
        this.state = {
            nfts: [],
            modal: false
        }
        reactAutobind(this)
    }

    static contextType = ContextModule;

    componentDidMount() {
        if (window.ethereum) {
            const { cookies } = this.props;
            const flag = cookies.get('flag') || false
            if (flag) {
                window.ethereum.request({ method: 'eth_requestAccounts' })
                    .then((res) => {
                        this.syncNFT(res[0])
                        this.context.setValue({
                            address: res[0]
                        })
                    })
            }
        }
    }

    async syncNFT(address) {
        let temp = await axios({
            method: 'get',
            url: `https://api.covalenthq.com/v1/1284/address/${address}/balances_v2/?key=${process.env.REACT_APP_Covalent}&format=JSON&nft=true&no-nft-fetch=false`,
            headers: {
                'Accept': 'application/json'
            }
        })
        temp = temp.data.data.items.filter(item => item.type === "nft");

        this.setState({
            nfts: temp[0].nft_data
        })
    }

    componentWillUnmount() {

    }

    connectMetamask() {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then((res) => {
                    const { cookies } = this.props;
                    cookies.set('flag', true, { path: '/' });
                    this.context.setValue({
                        address: res[0]
                    })
                })
        }
    }

    render() {
        return (
            <>
                <Modal backdrop isOpen={this.state.modal} size={"lg"}>
                    <ModalHeader onClick={() => this.setState({ modal: !this.state.modal })} style={{ backgroundColor: "#18181b", color: "white" }}>
                        Awards
                    </ModalHeader>
                    <ModalBody style={{ backgroundColor: "#0E0E10", color: "white", display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
                        {
                            this.state.nfts.map((item, index) =>
                                <div key={"NFT-images-" + index} style={{ display: "flex", flexDirection: "column", width: "30%", textAlign: "center" }}>
                                    <img alt={"NFT-images-" + index} src={item.external_data.image_1024} />
                                    <span style={{ fontWeight: "bold", fontSize: "1.3rem" }}>
                                        {
                                            item.external_data.name
                                        }
                                    </span>
                                    <span>
                                        {
                                            item.external_data.description
                                        }
                                    </span>
                                </div>
                            )
                        }
                    </ModalBody>
                </Modal>
                <div style={{ position: "absolute", top: "0px", height: "6%", width: "100%", backgroundColor: "#18181b", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: "white", cursor: "pointer" }} onClick={() => window.open("/")}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <img alt='igd0001' src={logo} style={{ height: window.innerHeight * (0.05) }} />
                    </div>
                    <div style={{ width: "25%" }}>
                        <Input placeholder='Search'></Input>
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                        <div onClick={() => this.setState({ modal: !this.state.modal })} style={{ cursor: "pointer" }}>
                            <img alt='is0001' src={NFT} width="32px"></img>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </div>
                        <Button color="warning" disabled={this.context.value.address !== ""} onClick={() => this.connectMetamask()}>
                            {
                                this.context.value.address !== "" ? "Metamask Connected" : "Connect Metamask"
                            }
                        </Button>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </div>
                </div>

            </>
        );
    }
}

export default withCookies(Header);