import React, { Component } from 'react';
import { Button } from 'reactstrap';
import PolkaWallet from '../components/polkaWallet';

class Test extends Component {
    constructor(props) {
        super(props);
        this.socket = new WebSocket("wss://16fe-54-144-149-165.ngrok.io/");
    }

    componentDidMount() {

        this.socket.onopen = () => {
            console.log("WebSocket Connected");
        };

        this.socket.onmessage = function (event) {
            console.log(`[message] Datos recibidos del servidor: ${event.data}`);
        };

        this.socket.onclose = function (event) {
            if (event.wasClean) {
                console.log(`[close] Conexión cerrada limpiamente, código=${event.code} motivo=${event.reason}`);
            } else {
                // ej. El proceso del servidor se detuvo o la red está caída
                // event.code es usualmente 1006 en este caso
                console.log('[close] La conexión se cayó');
            }
        };

        this.socket.onerror = function (error) {
            console.log(`[error]`);
        };
    }

    componentWillUnmount() {

    }

    render() {
        return (
            <div>
                <PolkaWallet/>
            </div>
        );
    }
}

export default Test;