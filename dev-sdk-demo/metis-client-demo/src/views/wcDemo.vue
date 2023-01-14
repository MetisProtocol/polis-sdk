<template>
  <div class="about">
    <h1>This is an test page wallect connect {{ this.accessToken }}</h1>
    <div style="margin-top: 20px">
      <div v-if="errMsg" style="color: red">{{ errMsg }}</div>
    </div>
    <div>
      <div v-if="accessToken">
        <div>
          <el-button type="primary" @click="disconnect">DisConnect</el-button>
        </div>
        <div>
          <el-row>
            <el-col>Wallet Connect</el-col>
          </el-row>

          <el-row :gutter="20" style="display: flow">
            <el-col :span="4"> wallet: </el-col>
            <el-col :span="10">
              <div><el-input v-model="wcUri"></el-input></div>
            </el-col>
            <el-col :span="3">
              <el-button type="primary" @click="initWalletConnector"
                >Wallet Connect</el-button
              >
            </el-col>
            <el-col :span="3">
              <el-button type="primary" @click="walletDisconnector"
                >Wallet Disconnect</el-button
              >
            </el-col>
          </el-row>

          <el-row :gutter="20" style="display: flow">
            <el-col :span="4"> client: </el-col>
            <el-col :span="10">
              <div><el-input v-model="wcUri"></el-input></div>
            </el-col>
            <el-col :span="3">
              <el-button type="primary" @click="initClientConnector"
                >Client Connect</el-button
              >
            </el-col>
          </el-row>
          <el-row :gutter="20" >
            <el-col :span="3">
              <el-button type="primary" @click="clientDisconnector"
                >Client Disconnect </el-button
              >
            </el-col>
            <el-col :span="3">
              <el-button type="primary" @click="getWCSession"
              >Client Session </el-button>
            </el-col>
            <el-col :span="3">
              <el-button type="primary" @click="testPersonalSignMessage"
              >Client SignMessage </el-button>
            </el-col>
          </el-row>

        </div>
        <br />
      </div>
      <div v-else>
        Access token not ready yet
        <el-button type="primary" @click="goRefreshToken">刷新 TOKEN</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { PolisClient, PolisProvier } from "@metis.io/middleware-client";
import BigNumber from "bignumber.js";
import Swal from "sweetalert2";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { providers, ethers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";

import WalletConnect from "@walletconnect/client";

/**
 * Warning: this page is just a demo
 * Under production module, access_token getting should place to server code like Java, C#, PHP ...
 */

export default {
  data() {
    return {
      appid: process.env.VUE_APP_APP_ID,
      appsecret: process.env.VUE_APP_APP_SECRET,
      // appid: "611cc74139481700e8885bc5",
      // appsecret: "40133e2b4a0e4dadbb4a867e2494c152",
      apiHost: process.env.VUE_APP_API_HOST,
      code: "",
      accessToken: "",
      refreshToken: "",
      expiresIn: 1800,
      errMsg: "",
      websocket: null,
      wsConnected: false,
      polisclient: null,
      showFreshBtn: true,
      balanceAddress: "",
      ethcallmethod: "get_block_number",
      ethcallargs: "",
      method: "",
      chainid: 588,
      balance: 0,
      address: "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4",
      result: "",
      userInfo: "",
      oauthInfo: {},
      loadingDialog: Swal.mixin({}),
      value: "",
      methods: [{value: "getdomain", label: "getdomain"}],
      message: "",
      contract: {
        domain: "test1",
        // domain: "l1bridge-666",
        // method: "depositERC20",
        method: "transfer",
        address: "0x8E1De235c879ca7b6BDA3Df8c16E42f8eB1Da8d1",
        args: "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4,100000000",
        // args: "0xe552fb52a4f19e44ef5a967632dbc320b0820639,0x4200000000000000000000000000000000000006,10000000,3200,",
        // args:"1000000000,0x507d2C5444Be42A5e7Bd599bc370977515B7353F",
        result: "",
      },
      ethTx: {
        to: "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4",
        value: "10000000000000000",
      },
      logs: {
        address: "",
        fromBlock: "",
        toBlock: "",
        topics: "",
      },
      logs2: {
        txhash: "",
      },
      wcConnector: null,
      wcClientConnector: null,
      wcUri: "",
      wcAddress: "",
      wcChainId: 0,
      wcAccounts: null,
    };
  },
  created() {
    //NOTE get confirm tx
    window.addEventListener(
        "message",
        (event) => {
          if (event.data && event.data.tx) {
            // TODO here
            // console.log(`tx callback ${event.data.tx}`)
          }
        },
        false
    );
  },
  mounted() {
    this.code = this.$route.query.code || "";
    this.getAccessToken();
  },
  methods: {
    loading() {
      this.loadingDialog.fire({
        html: "Processing...",
        didOpen: () => {
          Swal.showLoading();
        },
      });
    },
    closeLoading() {
      this.loadingDialog.close();
    },
    disconnect() {
      // window.open( 'http://localhost:1024/#/oauth2-logout','','height=200,width=200,top=-100,left=-100');
      this.polisclient.connect(this.oauthInfo);
      this.polisclient
          .disconnect()
          .then((res) => {
            console.log("logout success:", res);
          })
          .catch((res) => {
            console.log("logout error:", res);
          });
    },
    initPolisClient(data) {
      this.oauthInfo = data;
      this.polisclient = new PolisClient({
        appId: this.appid,
        chainId: this.chainid,
        apiHost: this.apiHost,
      });

      this.polisclient.on("debug", function (data) {
        console.log("debug data:%s", JSON.stringify(data));
      });
      this.polisclient.on("tx-confirm", function (data) {
        console.log("tx-confirm", data);
      });
      this.polisclient.on("error", function (data) {
        console.log("error:", data instanceof Error);
      });
    },
    goRefreshToken() {
      let refresh_token = localStorage.getItem("refresh-token");
      // axios.get(`https://polis.metis.io/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}`)
      axios
          .get(
              process.env.VUE_APP_TOKEN_URL +
              `/api/v1/oauth2/refresh_token?app_id=${this.appid}&app_key=${this.appsecret}&refresh_token=${refresh_token}`
          )
          .then((res) => {
            console.log(res);
            if (res.status == 200 && res.data && res.data.code == 200) {
              this.accessToken = res.data.data.access_token;
              this.refreshToken = res.data.data.refresh_token;
              this.expiresIn = res.data.data.expires_in;
              this.initPolisClient(res.data.data);
              this.errMsg = "";
            } else if (res.status == 200 && res.data) {
              this.errMsg = res.data.msg;
            }
          });
    },
    getAccessToken() {
      if (!this.code) {
        return;
      }
      // axios.get(`https://polis.metis.io/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}`)
      axios
          .get(
              process.env.VUE_APP_TOKEN_URL +
              `/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}`
          )
          .then((res) => {
            console.log(res);
            if (res.status == 200 && res.data && res.data.code == 200) {
              this.accessToken = res.data.data.access_token;
              this.refreshToken = res.data.data.refresh_token;
              localStorage.setItem("refresh-token", this.refreshToken);
              this.expiresIn = res.data.data.expires_in;
              this.errMsg = "";
              this.initPolisClient(res.data.data);
            } else if (res.status == 200 && res.data) {
              this.errMsg = res.data.msg;
              this.showFreshBtn = false;
            } else {
              this.showFreshBtn = false;
            }
          });
    },

    async initWalletConnector() {
      // Create connector
      // if(this.wcConnector){
      //   this.wcConnector.killSession();
      //   console.log("kill first");
      // }
      console.log("uri:", this.wcUri);
      this.wcConnector = new WalletConnect({
        // Required
        uri: this.wcUri,
        // Required
        // clientMeta: {
        //   description: "WalletConnect Developer App",
        //   url: "https://walletconnect.org",
        //   icons: ["https://walletconnect.org/walletconnect-logo.png"],
        //   name: "PolisWalletConnect",
        // },
      });
      console.log("connected:", this.wcConnector.connected);

      if (this.wcConnector.session) {
        console.log("session1:", this.wcConnector.session);
      }

      if (!this.wcConnector.connected) {
        console.log("start create seesion.");
        await this.wcConnector.createSession();
        console.log("end create seesion.");
        console.log("session2:", this.wcConnector.session);
      }

      // Subscribe to session requests
      this.wcConnector.on("session_request", (error, payload) => {
        if (error) {
          throw error;
        }
        console.log("session_request:", payload);
        console.log("peerMeta:", payload.params[0]);
        // Handle Session Request
        if (this.wcConnector) {
          this.wcConnector.approveSession({
            chainId: 588,
            accounts: ["0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4"],
          });
        }
        /* payload:
        {
          id: 1,
          jsonrpc: '2.0'.
          method: 'session_request',
          params: [{
            peerId: '15d8b6a3-15bd-493e-9358-111e3a4e6ee4',
            peerMeta: {
              name: "WalletConnect Example",
              description: "Try out WalletConnect v1.0",
              icons: ["https://example.walletconnect.org/favicon.ico"],
              url: "https://example.walletconnect.org"
            }
          }]
        }
        */
      });

      // Subscribe to call requests
      this.wcConnector.on("call_request", (error, payload) => {
        if (error) {
          throw error;
        }
        console.log("call_request:", payload);
        // Handle Call Request
        console.log("connected:", this.wcConnector.connected);
        console.log("session3:", this.wcConnector.session);

        /* payload:
        {
          id: 1,
          jsonrpc: '2.0'.
          method: 'eth_sign',
          params: [
            "0xbc28ea04101f03ea7a94c1379bc3ab32e65e62d3",
            "My email is john@doe.com - 1537836206101"
          ]
        }
        */
      });

      this.wcConnector.on("disconnect", (error, payload) => {
        if (error) {
          throw error;
        }
        // Delete connector
      });

      this.wcConnector.on("connect", (error, payload) => {
        console.log("EVENT", "connect");
        if (error) {
          throw error;
        }
        // this.setState({ connected: true });
      });

      console.log("event on connected:", this.wcConnector.connected);
    },
    walletDisconnector() {
      if (this.wcConnector) this.wcConnector.killSession();
    },
    async getWCSession(){
      const res =await axios.get( process.env.VUE_APP_TOKEN_URL +
           `/api/v1/oauth2/wc_session`,{
         headers: {'Access-Token':this.accessToken}
       })
      console.log("server wc session:",res.data.data.session)
      const wcSession = res.data.data.session;

      window.localStorage.setItem("walletconnect",wcSession);
    },
    async initClientConnector() {
      // bridge url
      const bridge = "https://bridge.walletconnect.org";

      // create new connector
      this.wcClientConnector = new WalletConnect({
        bridge,
        qrcodeModal: QRCodeModal,
      });

      console.log("connected:", this.wcClientConnector.connected);

      if (this.wcClientConnector.session) {
        console.log("session:", this.wcClientConnector.session);
      }

      if (!this.wcClientConnector.connected) {
        console.log("client start create seesion.");
        await this.wcClientConnector.createSession();
        console.log("client end create seesion.");
        console.log("session:", this.wcClientConnector.session);
      }

      // Subscribe to session requests
      this.wcClientConnector.on("session_request", (error, payload) => {
        if (error) {
          throw error;
        }
        console.log("session_request:", payload);
        console.log("peerMeta:", payload.params[0]);
        // Handle Session Request
        if (this.wcConnector) {
          this.wcConnector.approveSession({
            chainId: 588,
            accounts: ["0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4"],
          });
        }
      });

      // Subscribe to call requests
      this.wcClientConnector.on("call_request", (error, payload) => {
        if (error) {
          throw error;
        }
        console.log("call_request:", payload);
        // Handle Call Request
      });

      this.wcClientConnector.on("disconnect", (error, payload) => {
        if (error) {
          throw error;
        }

        // Delete connector
      });

      this.wcClientConnector.on("connect", (error, payload) => {
        console.log("EVENT connect", payload);

        if (error) {
          throw error;
        }
        this.wcAccounts = payload[0].accounts;
        this.wcAddress = this.wcAccounts[0]
        this.wcChainId =payload[0].chainId;
        // this.setState({ connected: true });
      });

    },
    clientDisconnector() {
      if (this.wcClientConnector) this.wcClientConnector.killSession();
    },
    async testPersonalSignMessage() {
      // const { connector, address, chainId } = this.state;
      const address = "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4"; //this.wcAddress;
      const connector = this.wcClientConnector;
      const chainId = this.wcChainId;

      const wcProvider = new WalletConnectProvider({
        rpc: {
          1: "https://mainnet.infura.io/v3/25ad049ae13a4315b47369b7679dea80",
          4: "https://rinkeby.infura.io/v3/25ad049ae13a4315b47369b7679dea80",
          588: "https://stardust.metis.io/?owner=588",
          1088: "https://andromeda.metis.io/?owner=1088"
        },
      })
      wcProvider.enable();
      const provider = new providers.Web3Provider(wcProvider);

      // test message
      const message = `My email is john@doe.com - ${new Date().toUTCString()}`;

      // encode message (hex)
      const hexMsg = ethers.utils.toUtf8Bytes(message);//  convertUtf8ToHex(message);

      // eth_sign params
      const msgParams = [hexMsg, address];

      try {

        // send message
        // const result = await connector.signPersonalMessage(msgParams);
        const signer = provider.getSigner();
        console.log("singer:",signer);
        const result =await signer.signMessage(hexMsg);
        // verify signature
       console.log("sing result:",result);

      } catch (error) {
        console.error(error);
      }
    },
  }
}
</script>

<style>
.el-button {
  margin-top: 10px;
}

.about {
  background-color: beige;
}
</style>
