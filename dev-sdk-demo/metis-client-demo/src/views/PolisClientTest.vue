<template>
  <div class="about">
    <h1>This is an test page Polis-Client {{ this.accessToken }}</h1>
    <div style="margin-top: 20px;">
      <div v-if="errMsg" style="color: red;">{{ errMsg }}</div>
    </div>
    <div>
      <div v-if="accessToken">
        <el-button type="primary" @click="disconnect">DisConnect</el-button>
        <div>
          Bridge MetaMask:<el-switch
            v-model="bridgeMetaMask"
            active-color="#13ce66"
            inactive-color="#ff4949">
        </el-switch>
        </div>
        <el-row :gutter="20">

          <el-col :span="6">
            <el-card class="box-card">
              contractAddress:
              <el-input placeholder="method" v-model="contract.address"/>
              result:
              <el-input type="textarea" rows="4" v-model="contract.result"></el-input>
              <el-button type="primary" @click="callContractViewMethod">contract view Method
              </el-button>
              <el-button type="primary" @click="mint">contract Payable Method
              </el-button>
            </el-card>
          </el-col>
          <!--sign message-->
          <el-col :span="6">
            <el-card class="box-card">
              message:
              <el-input placeholder="method" v-model="message"/>
              result:
              <el-input type="textarea" rows="4" v-model="result"></el-input>
              <el-button type="primary" @click="signMessage">Sign Message
              </el-button>
              <el-button type="primary" @click="callContractPayable">contract Payable Method
              </el-button>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <div slot="header" class="clearfix">
                <span>GET BALANCE</span>
              </div>
              chainId:
              <el-input v-model="chainid"/>
              address:
              <el-input v-model="balanceAddress"/>
              balance:
              <el-input :disabled="true" v-model="balance"/>
              <el-button type="primary" v-if="accessToken" @click="getBalance">HTTP: getBalance MET
              </el-button>
            </el-card>
            <el-card class="box-card">
              <div slot="header" class="clearfix">
                <span>GET UserInfo</span>
              </div>
              UserInfo:
              <el-input type="textarea" rows="4" v-model="userInfo"/>
              <el-button type="primary" v-if="accessToken" @click="getUserInfo">HTTP: get UserInfo
              </el-button>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <div slot="header" class="clearfix">
                <span>ETH Trans</span>
              </div>
              chain:
              <el-input placeHolder="chain id" v-model="chainid"/>
              to address:
              <el-input placeHolder="contract address" v-model="ethTx.to"/>
              value:
              <el-input placeHolder="fromBlock" v-model="ethTx.value"/>
              <el-button type="primary" @click="sendTransaction">Send Transaction</el-button>

              <el-button type="primary">HTTP:</el-button>

            </el-card>
          </el-col>
        </el-row>
      </div>
      <div v-else>
        Access token not ready yet
        <el-button type="primary" @click="goRefreshToken">刷新 TOKEN</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import {PolisClient, PolisProvier} from '@metis.io/middleware-client'
import BigNumber from "bignumber.js";
import Swal from 'sweetalert2'
import {ethers} from 'ethers'

/**
 * Warning: this page is just a demo
 * Under production module, access_token getting should place to server code like Java, C#, PHP ...
 */

export default {
  data() {
    return {
      bridgeMetaMask:true,
      appid: process.env.VUE_APP_APP_ID,
      appsecret: process.env.VUE_APP_APP_SECRET,
      // appid: "611cc74139481700e8885bc5",
      // appsecret: "40133e2b4a0e4dadbb4a867e2494c152",
      apiHost: process.env.VUE_APP_API_HOST,
      code: '',
      accessToken: '',
      refreshToken: '',
      expiresIn: 1800,
      errMsg: '',
      websocket: null,
      wsConnected: false,
      polisclient: null,
      showFreshBtn: true,
      balanceAddress: '',
      ethcallmethod: 'get_block_number',
      ethcallargs: '',
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
      methodResult: "",
      ethCallResult: "",
      pre_auth_code: "",
      message: "",
      contract: {
        domain: "test1",
        // domain: "l1bridge-666",
        // method: "depositERC20",
        method: "transfer",
        address: "0x5Bc3b55890A44e038206bac2e2fC10aB4c22C1aB",
        args: "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4,100000000",
        // args: "0xe552fb52a4f19e44ef5a967632dbc320b0820639,0x4200000000000000000000000000000000000006,10000000,3200,",
        // args:"1000000000,0x507d2C5444Be42A5e7Bd599bc370977515B7353F",
        result: ""
      },
      ethTx: {
        to: '0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4',
        value: "10000000000000000",
      },
      logs: {
        address: "",
        fromBlock: "",
        toBlock: "",
        topics: ""
      }, logs2: {
        txhash: ""
      }
    }
  },
  created() {
    //NOTE get confirm tx
    window.addEventListener("message", (event) => {
      if (event.data && event.data.tx) {
        // TODO here
        // console.log(`tx callback ${event.data.tx}`)
      }
    }, false);
    this.pre_auth_code = localStorage.getItem("precode")
    console.log("pre code:",this.pre_auth_code);
  },
  mounted() {
    this.code = this.$route.query.code || ''
    this.getAccessToken();

    // let a= ethers.utils.toUtf8String("0xf8a813843b9aca10829483948e1de235c879ca7b6bda3df8c16e42f8eb1da8d180b844a9059cbb000000000000000000000000f1181bd15e8780b69a121a8d8946cc1c23972bd40000000000000000000000000000000000000000000000000000000005f5e1002ca061364a44f3addd135f3f6c315273f1d3cec6a870b423f210ae2381e7af3b3244a010fbd295b4e1d696e7f46bb1384bc9c515029056f4f24af757a3434856941736")
    // console.log(a);
  },
  methods: {
    loading() {
      this.loadingDialog.fire({
        html: "Processing...",
        didOpen: () => {
          Swal.showLoading();
        }
      });
    },
    closeLoading() {
      this.loadingDialog.close();
    },
    disconnect() {
      // window.open( 'http://localhost:1024/#/oauth2-logout','','height=200,width=200,top=-100,left=-100');
      this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask);
      this.polisclient.disconnect()
          .then(res => {
            console.log("logout success:", res)
          })
          .catch(res => {
            console.log("logout error:", res)
          })
    },
    initPolisClient(data) {
      this.oauthInfo = data;
      this.polisclient = new PolisClient({
        appId: this.appid,
        chainId: this.chainid,
        apiHost: this.apiHost
      })

      this.polisclient.on('debug', function (data) {
        console.log('debug data:%s', JSON.stringify(data));
      })
      this.polisclient.on('tx-confirm', function (data) {
        console.log('tx-confirm', data)
      });
      this.polisclient.on('error', function (data) {
        console.log('error:', data instanceof Error)
      });

      this.polisclient.on('chainChanged', (chainId) => {
        console.log('polis-client print chainId =>', chainId);
      });
      this.polisclient.on('accountsChanged', (account) => {
        console.log('polis-client print account =>', account);
      });
    },
    goRefreshToken() {
      let refresh_token = localStorage.getItem("refresh-token");
      // axios.get(`https://polis.metis.io/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}`)
      axios.get(process.env.VUE_APP_TOKEN_URL + `/api/v1/oauth2/refresh_token?app_id=${this.appid}&app_key=${this.appsecret}&refresh_token=${refresh_token}`)
          .then(res => {
            console.log(res)
            if (res.status == 200 && res.data && res.data.code == 200) {
              this.accessToken = res.data.data.access_token
              this.refreshToken = res.data.data.refresh_token
              this.expiresIn = res.data.data.expires_in
              console.log("auth info:",res.data.data)
              this.initPolisClient(res.data.data)
              this.errMsg = "";
            } else if (res.status == 200 && res.data) {
              this.errMsg = res.data.msg
            }
          })
    },
    getAccessToken() {
      if (!this.code) {
        return
      }
      // axios.get(`https://polis.metis.io/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}`)
      axios.get(process.env.VUE_APP_TOKEN_URL + `/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}&pre_auth_code=${this.pre_auth_code}`)
          .then(res => {
            console.log(res)
            if (res.status == 200 && res.data && res.data.code == 200) {
              this.accessToken = res.data.data.access_token
              this.refreshToken = res.data.data.refresh_token
              localStorage.setItem("refresh-token", this.refreshToken)
              this.expiresIn = res.data.data.expires_in
              this.errMsg = ""
              console.log("auth info:",res.data.data)

              this.initPolisClient(res.data.data);

            } else if (res.status == 200 && res.data) {
              this.errMsg = res.data.msg
              this.showFreshBtn = false;
            } else {
              this.showFreshBtn = false;
            }
          })
    },
    async callContractViewMethod() {
      if (!this.polisclient) {
        alert('httpclient not init')
        return;
      }
      const daiAddress = this.contract.address;

      const daiAbi = [
        // Some details about the token
        "function name() view returns (string)",
        "function symbol() view returns (string)",

        // Get the account balance
        "function balanceOf(address) view returns (uint)",

        // Send some of your tokens to someone else
        "function transfer(address to, uint amount)",

        // An event triggered whenever anyone transfers to someone else
        "event Transfer(address indexed from, address indexed to, uint amount)"
      ];
      console.log("chain id:", this.chainid);
      console.log('this.polisclient.web3Provider =>', this.polisclient.web3Provider)
      this.polisclient.once("changeChain", function (id) {
        console.log("changeChain id", id)
      })
      this.polisclient.changeChain(this.chainid);
      const daiContract = this.polisclient.getContract(daiAddress, daiAbi);
      this.contract.result = await daiContract.name();
      // console.log(this.contract.result)
      const daiContract2 = new ethers.Contract(daiAddress, daiAbi, this.polisclient.web3Provider);
      // const provider = new ethers.providers.JsonRpcProvider("https://stardust.metis.io/?owner=588");
      // const daiContract2 = new ethers.Contract(daiAddress, daiAbi, provider);
      this.contract.result += "|" + await daiContract2.name();

    },

    async mint() {

      this.polisclient.changeChain(this.chainid);
      await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask)
      let daiAddress = "0x5E30d8B9F802b1836B55e6F67EAF8a668A99Af0B";
      let daiAbi = ['function mint(address to, uint amount) returns (bool)'];
      let daiContract2 = this.polisclient.getContract(daiAddress, daiAbi);
      this.contract.result =JSON.stringify( await daiContract2.mint('0x354c6e41EFb6c70dd0810C14E72f89fbdd070D90', ethers.utils.parseUnits('1', 18)));


    },

    async callContractPayable() {

      this.polisclient.changeChain(this.chainid);
      await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask)
      // test dac
      // let daiAddress = "0xDCf1E303b83872B129B1AfEf6443E2c2d1AA70B1";
      // let daiAbi = [
      //   "function createDAC(address[] admins,uint256 threshold ,bytes data) nonpayable returns (address dac,address owner)"
      // ]
      // // const daiContract2 = new ethers.Contract(daiAddress, daiAbi, this.polisclient.web3Provider);
      // let daiContract2 = this.polisclient.getContract(daiAddress, daiAbi);
      // const addresss = ['0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4', '0xA35f56ebF874Df1B6aC09E72528e1a86D4F1EF2B']
      // const data = ethers.utils.defaultAbiCoder.encode(
      //     ["string", "string", "string", "bool", "string", "string"],
      //     ["id1234567", "name1234567", "logo1234567", true, "", ""],
      // );
      // // const data = '0x00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000000870306a3669387431000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c6e616d6570306a36693874310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c6c6f676f70306a36693874310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001064657363206f662070306a3669387431000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006746573742c350000000000000000000000000000000000000000000000000000';
      // this.contract.result = await daiContract2?.createDAC(addresss, 1, data);


      //test erc20
      let daiAddress = this.contract.address;
      let daiAbi = ['function transfer(address to,uint256 amount)'];
      let daiContract2 = this.polisclient.getContract(daiAddress, daiAbi);
      this.contract.result =JSON.stringify( await daiContract2.transfer('0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4',1000000000000));


      //ethers
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const opts: IPolisProviderOpts = {
      //   apiHost: 'http://polis-test.metis.io/',  // api host
      //   token?: {accessToken}, //optional oauth2 access token
      //   chainId: 4,
      // }
      // const provider = new PolisProvider(opts)

    },
    getBalance() {
      let dom = this;
      this.polisclient.changeChain(this.chainid);
      this.polisclient.web3Provider.getBalance(this.balanceAddress).then(res => {

        console.log("balance:" + res.toString());
        let value = res.toString();
        let res2 = new BigNumber(value);
        let a = res2.div("1000000000000000000");
        this.balance = (a.toString());
      }, res => {
        console.log("get balance error:", res)
      })

    },
    async sendTransaction() {
      this.polisclient.changeChain(this.chainid);
      // return;
      try{
        //todo test token expire
        // this.oauthInfo.accessToken = this.oauthInfo.accessToken+"1";
        const connected = await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask);
        console.log("connected:",connected)
        const valueHex = '0x' + new BigNumber(this.ethTx.value).toString(16);
        const tx = {
          to: this.ethTx.to,
          value: valueHex,
        }
        this.loading();
        this.polisclient.web3Provider.getSigner().sendTransaction(tx).then(async res => {
          this.closeLoading();
          this.loading();
          await res.wait()
          this.closeLoading();
          this.result = JSON.stringify(res);
          alert(this.result)
        }).catch((err) => {
          console.log("err:", err);
          this.closeLoading();
        })
      }catch (e) {
        console.log(e)
      }

    },
    async getUserInfo() {
      this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask);
      await this.polisclient.getUserInfoAsync().then(res => {
        this.userInfo = JSON.stringify(res);
        console.log("user info:" + this.userInfo)
      }).catch(err => {
        alert(err)
      })
    },
    callOauthMethod() {
      switch (this.method) {
        case "getdomain":
          this.httpclient.getDomain("test1", "435").then(res => {
            this.methodResult = JSON.stringify(res);
            console.log("methodResult:" + this.methodResult)
          })
          break;
      }
    },
    oauthEthCall() {
      let args = null;
      if (this.ethcallargs.length > 0)
        args = this.ethcallargs.split(",");
      const param = {
        chainid: this.chainid,
        method: this.ethcallmethod,
        args: args
      }
      this.httpclient.providerCall(param).then(res => {
        this.ethCallResult = JSON.stringify(res);
        console.log("methodResult:" + this.ethCallResult)
      })
    },
    async signMessage() {
      await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask)
      this.polisclient.web3Provider.getSigner().signMessage(this.message).then(res => {
        this.result = res;
      }).catch(err => {
        alert(err)
      })
    },
    async callContractMethod() {
      const address = "0x091Ea445cf67a24233E9aa7775CAb69AA7976432"
      const abi = [{
        "inputs": [],
        "name": "invitationCode",
        "outputs": [
          {
            "internalType": "uint32",
            "name": "",
            "type": "uint32"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }]
      const polisClient = new PolisClient({
        appId: appid,
        chainId: 588,
        apiHost: polisURL
      });
      polisClient.connect(JSON.parse(localStorage.authInfo),this.bridgeMetaMask);
      const daiContract = polisClient.getContract(address, abi);
      const re = await daiContract["invitationCode"]();
    }
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
