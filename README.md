# PolkaCharity
 
 <img src="https://i.ibb.co/CBgLXBh/logo-3.png" >

<p>

PolkaCharity is a Polkadot and moonbeam based decentralized streaming platform where creators can create charity-based streams for social, environmental and economic causes.


# Watch our demo video:

[![Demo](https://i.ibb.co/j3DCtPZ/image.png)](Pending)

# Test the product:

## URL: https://www.polkacharity.site/

## Requirements

- Use Moonbeam Mainnet on Metamask Wallet!
  - Get it on Metamask: https://metamask.io/
  - https://docs.moonbeam.network/tokens/connect/metamask/

- Use Polkadot Parachains (Mainnets) on PolkadotJS Wallet!
  - Get it on PolkadotJS: https://polkadot.js.org/extension/

# Diagram:

<img src="https://i.ibb.co/XkSfrf5/scheme-drawio-1.png" >

## Tech we Use:

- Polkadot Network:
  - Using PolkadotJS to send tokens from XCM compatible parachains directly to Moonbeam.
    - https://docs.moonbeam.network/builders/interoperability/xcm/xc20/xc20/
  - Review of the balances of each token per network using the NodeJS Polkadot API.
    - https://www.npmjs.com/package/@polkadot/api
- Moonbeam Network:
  - We use the Metamask Wallet to make Glimmer donations
    - https://docs.moonbeam.network/tokens/connect/metamask/
  - Use of the XCM library to send and receive Xtokens.
    - https://www.npmjs.com/package/@moonbeam-network/xcm-sdk
  - NFT Management, all the NFT's that occur on the platform will be created and minted on the Moonbeam network.
    - ERC721 Token [0xc2b0889F8171C1F5B6f11f76f7C25d6bBb830b5d](https://moonbeam.moonscan.io/token/0xc2b0889f8171c1f5b6f11f76f7c25d6bbb830b5d?a=0xf55285649c3413f57b95c49fbad71f0e5646fa14)
- Covalent:
  - Obtaining the account's GLMR and Xtokens (ERC20 Interface) Balances.
  - Obtaining the account's NFT Balances.
- Pokt Network
  - RPC personal para el proyecto y no tener las limitaciones el RPC publico.
- Livepeer:
  - RTMP URL:
    - Url to easily transmit from the OBS and start our transmission.
  - Livestreams and Recordings API:
    - Obtaining the url if a streamr is live.
    - Obtaining the last record of each streamer if he is offline.
- EC2:
  - Public Chat:
    - To make the chat public, a Secure WebSocket installed in an EC2 virtual machine on AWS is used.

# How it's built:

## Moonbeam Network:

<img src="https://i.ibb.co/NpGt6Br/image.png" width="300px">

Moonbeam's network was used for all Chat Sign-in control, Glimmer (Native Token) management and all XCM-compatible X-Tokens. This in order to be able to receive tokens from any of the parachains in the Polkadot ecosystem.

<img src="https://i.ibb.co/PmGp17t/image.png" >

In order to obtain the balances of each of the X-Tokens in the Moonbeam network, the ECR20 interface of the following contract was used, this is the standard ERC20 contract for any EVM, all controlled by the library [Ethers.js](https://docs.ethers.org/v5/).

    async getBalanceToken(address, tokenAddress) {
            return new Promise(async (resolve, reject) => {
                const contract = new ethers.Contract(tokenAddress, abiERC20, this.provider);
                let res = await contract.balanceOf(address)
                let decimals = await contract.decimals()
                resolve(res / (Math.pow(10, decimals)))
            })
        }

[Complete Code](./WebDApp/src/components/summary.js)

Within our platform we have a summary where we can see all the donations in real time.

<img src="https://i.ibb.co/HrQbbsk/image.png">

In turn, all the NFT's that we deploy on the platform and that are the way to reward users who donated money in each network, are on the Moonbeam Mainnet network in the following contract.

[Moonbeam Explorer](https://moonbeam.moonscan.io/token/0xc2b0889f8171c1f5b6f11f76f7c25d6bbb830b5d?a=0xf55285649c3413f57b95c49fbad71f0e5646fa14)

The Solidity code that was used for them is the following.

[NFT Code](./Contracts/NFT.sol)

The trophies that we deliver are seen on the platform as follows.

<img src="https://i.ibb.co/PjGpqf3/image.png">

## Polkadot Network:

<img src="https://i.ibb.co/qnt8Wtd/image.png" width="300px">

Through Polkadot's [XCM-SDK](https://docs.moonbeam.network/builders/interoperability/xcm/xcm-sdk/xcm-sdk/) we can easily make transfers from any of the parachains that have an X-Token contract deployed on them.

- As of today 02/17/23, the mainnet parachains compatible with this library are the following.

  - Bifrost BNC <img src="./Images/tokenLogos/bnc.png" height="16px">
  - Acala ACA <img src="./Images/tokenLogos/acala.png" height="16px">
  - Acala AUSD <img src="./Images/tokenLogos/ausd.png" height="16px">
  - Astar ASTR <img src="./Images/tokenLogos/astar.png" height="16px">
  - Darwinia RING <img src="./Images/tokenLogos/ring.png" height="16px">
  - Interlay IBTC <img src="./Images/tokenLogos/ibtc.png" height="16px">
  - Interlay INTR <img src="./Images/tokenLogos/intr.png" height="16px">
  - Parallel PARA <img src="./Images/tokenLogos/para.png" height="16px">
  - Phala PHA <img src="./Images/tokenLogos/pha.png" height="16px">
  - Polkadot DOT <img src="./Images/tokenLogos/dot.png" height="16px">
  - Statemint USDT <img src="./Images/tokenLogos/usdt.png" height="16px">

All of them are compatible with donations and it is possible to send them through the Polkadot.js Wallet combined with the library [@polkadot/extension-dapp](https://www.npmjs.com/package/@polkadot/extension-dapp)

<img src="https://i.ibb.co/Rc0JrVk/vlcsnap-2023-02-17-00h18m05s133.png" width="300px">

## Covalent:

<img src="https://i.ibb.co/bX0ZJ86/Image.png" >

Our application by requiring that we quickly look up if it has NFT's in it, we were able to find a way to do it efficiently from the Covalent API's.

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

[Complete Code](./WebDApp/src/components/header.js)

## Livepeer:

<img src="https://i.ibb.co/pf527Tc/image.png">

All the streaming services were done through Livepeer.

<img src="https://i.ibb.co/PGN0Rjm/New-Project-3.png">

To manage Streamers, the profiles of each of the Streamers were created within the Livepeer dashboard, with which we were able to provide each Streamer with their keys to perform their Streams.

<img src="https://i.ibb.co/hm91zfZ/vlcsnap-2023-02-17-00h45m28s428.png">

Thanks to the Livepeer APIs it was possible for us to obtain if the Streamers were doing a Live, thanks to this the viewers could always be aware when a live stream is made.

<img src="https://i.ibb.co/w0jSyf9/image.png">

The section of code that allows us to obtain the profiles, recordings and states (live or offline) is the following.

Code Snippet:

    var myHeaders = new Headers();
    myHeaders.append("authorization", process.env.REACT_APP_LIVEPEER_BEARER);

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    fetch("https://livepeer.com/api/stream?streamsonly=1", requestOptions)
        .then(response => response.text())
        .then(async (result) => {
            let res = JSON.parse(result).filter((item) => item.id === this.data.streamID)
            let live = res[0]?.isActive ?? false
            this.setState({
                live
            })
        })

    fetch(`https://livepeer.com/api/stream/${this.data.streamID}/sessions?record=1`, requestOptions)
        .then(response => response.text())
        .then(async (result) => {
            let recordId = JSON.parse(result)[0].id
            this.setState({
                recordId
            })
        })
        .catch(error => console.log('error', error));

[Complete Code](./WebDApp/src/pages/streamer.js)

## Pokt:

<img src="https://i.ibb.co/KxrDm9L/image.png" >

Pokt was mainly used to get a private RPC for the project, in order to get around the limitations of Moonbeam's public RPC.

<img src="https://i.ibb.co/Pmng1jm/image.png" >

## EC2:

<img src="https://i.ibb.co/k8zYq7X/image-4.png" >

Using EC2 for websockets was a quick way to make a chat that worked in real time, also being a container it is possible to deploy it in almost any other provider, whether centralized or decentralized.

    // Importing the required modules
    const WebSocketServer = require('ws');

    // Creating a new websocket server
    const wss = new WebSocketServer.Server({ port: 1883 })

    // Creating connection using websocket
    wss.on("connection", ws => {
        ws.on("message", data => {
            if (data.toString() === "ping") {
                ws.send("pong")
            }
            else {
                wss.clients.forEach((client) => {
                    client.send(`${data}`);
                })
            }
        });

        // handling what to do when clients disconnects from server
        ws.on("close", () => {
            console.log("the client has connected");
        });
        // handling client connection error
        ws.onerror = function () {
            console.log("Some Error occurred")
        }
    });

    console.log("The WebSocket server is running on port 1883");

- [Complete Server Code](./WebSocketContainer/websocket/app/index.js)

- [Complete WebDapp Code](./WebDApp/src/components/chat.js)

- [Container for Deployment](./WebSocketContainer/)

# References

https://www.twitch.tv/creatorcamp/en/connect-and-engage/charity-streaming/

https://www.donordrive.com/charity-streaming/

https://www.youtube.com/watch?v=Hh4T4RuK1H8
