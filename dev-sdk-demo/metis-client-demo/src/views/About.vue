<template>
  <div class="about">
    <h1>This is an test page {{ this.accessToken }}</h1>
    <div style="margin-top: 20px;">
      <div v-if="errMsg" style="color: red;">{{ errMsg }}</div>
    </div>
    <div>
      <div v-if="accessToken">
        <button type="button" @click="logout">Log Out</button>
        <button type="button" @click="testDAC">testDAC</button>
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
              <div slot="header" class="clearfix">
                <span>WS Test Call Smart Contract</span>
              </div>
              <el-button type="primary" @click="addToken">Add token
              </el-button>
              <el-button type="primary" @click="handleCallContract">WS: Test call smart contract
              </el-button>
            </el-card>

            <el-card class="box-card">
              <div slot="header" class="clearfix">
                <span>OAUTH METHOD CALL</span>
              </div>
              <el-select v-model="method">
                <el-option
                    v-for="item in methods"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                >
                </el-option>
              </el-select>
              <el-input type="textarea" rows="4" v-model="methodResult"/>
              <el-button type="primary" @click="callOauthMethod">Call
              </el-button>
            </el-card>

            <el-card class="box-card">
              <div slot="header" class="clearfix">
                <span>OAUTH ETH CALL</span>
              </div>
              method:
              <el-input placeholder="method" v-model="ethcallmethod"/>
              chainid:
              <el-input placeholder="chainid" v-model="chainid"/>
              args:
              <el-input type="textarea" rows="4" v-model="ethcallargs"/>
              result:
              <el-input type="textarea" rows="4" v-model="ethCallResult"/>
              <el-button type="primary" @click="oauthEthCall">Call
              </el-button>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="box-card">
              <div slot="header" class="clearfix">
                <span>HTTP Test Call Smart Contract</span>
              </div>
              domain:
              <el-input id="domain" placeholder="domain" v-model="contract.domain"/>
              <br/>
              chainid:
              <el-input placeholder="chainid" v-model="chainid"/>
              <br/>
              method:
              <el-input placeholder="method" v-model="contract.method"/>
              <br/>
              value:
              <el-input placeholder="method" v-model="value"/>
              <br/>
              args:
              <el-input type="textarea" rows="4" v-model="contract.args"></el-input>
              result:
              <el-input type="textarea" rows="4" v-model="contract.result"></el-input>
              <el-button type="primary" @click="handleCallContractByHttp">HTTP: Test call smart contract
              </el-button>
              <el-button type="primary" @click="handleCallestimateGas">HTTP: Test call estimateGas
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
                <span>GET LOGS</span>
              </div>
              chain:
              <el-input placeHolder="chain id" v-model="chainid"/>
              contract address:
              <el-input placeHolder="contract address" v-model="logs.address"/>
              fromBlock:
              <el-input placeHolder="fromBlock" v-model="logs.fromBlock"/>
              toBlock:
              <el-input placeHolder="toBlock" v-model="logs.toBlock"/>
              topics:
              <el-input placeHolder="topics" v-model="logs.topics"/>

              txHash:
              <el-input placeHolder="txHash" v-model="logs2.txhash"/>

              result:
              <el-input type="textarea" v-model="result" rows="3"></el-input>


              <el-button type="primary" @click="getLogs">HTTP: getLogs</el-button>

              <el-button type="primary" @click="getLogsByTxHash">HTTP: getLogsByTxHash</el-button>

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
import {WebSocketClient, HttpClient, Oauth2Client} from '@metis.io/middleware-client'
import Swal from 'sweetalert2';
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
      apiHost: process.env.VUE_APP_API_HOST,
      // appid: "611cc74139481700e8885bc5",
      // appsecret: "40133e2b4a0e4dadbb4a867e2494c152",
      code: '',
      accessToken: '',
      refreshToken: '',
      expiresIn: 1800,
      errMsg: '',
      websocket: null,
      wsConnected: false,
      httpclient: null,
      oauth2Client: null,
      showFreshBtn: true,
      balanceAddress: '',
      ethcallmethod: 'get_block_number',
      ethcallargs: '',
      method: "",
      chainid: 599,
      balance: 0,
      address: "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4",
      result: "",
      userInfo: "",
      value: "",
      methods: [{value: "getdomain", label: "getdomain"}],
      methodResult: "",
      ethCallResult: "",
      contract: {
        domain: "test1",
        // domain: "l1bridge-666",
        // method: "depositERC20",
        method: "transfer",
        address: "",
        args: "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4,100000000",
        // args: "0xe552fb52a4f19e44ef5a967632dbc320b0820639,0x4200000000000000000000000000000000000006,10000000,3200,",
        // args:"1000000000,0x507d2C5444Be42A5e7Bd599bc370977515B7353F",
        result: ""
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
  },

  mounted() {
    this.code = this.$route.query.code || ''
    this.getAccessToken();

  },
  methods: {
    logout() {
      // window.open( 'http://localhost:1024/#/oauth2-logout','','height=200,width=200,top=-100,left=-100');

      this.oauth2Client.logout(this.appid, this.accessToken, this.refreshToken).then(res => {
        console.log("logout success:", res)
      })
          .catch(res => {
            console.log("logout error:", res)
          })
    },
    goRefreshToken() {
      let refresh_token = localStorage.getItem("refresh-token");
      // axios.get(`https://polis.metis.io/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}`)
      axios.get(process.env.VUE_APP_API_HOST + `/api/v1/oauth2/refresh_token?app_id=${this.appid}&app_key=${this.appsecret}&refresh_token=${refresh_token}`)
          .then(res => {
            if (res.status == 200 && res.data && res.data.code == 200) {
              this.accessToken = res.data.data.access_token
              this.refreshToken = res.data.data.refresh_token
              this.expiresIn = res.data.data.expires_in

              this.initWebsocket()
              this.initHttpClient()
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
      axios.get(process.env.VUE_APP_API_HOST + `/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}`)
          .then(res => {
            if (res.status == 200 && res.data && res.data.code == 200) {
              this.accessToken = res.data.data.access_token
              this.refreshToken = res.data.data.refresh_token
              localStorage.setItem("refresh-token", this.refreshToken)
              this.expiresIn = res.data.data.expires_in
              this.initWebsocket()
              this.initHttpClient()

            } else if (res.status == 200 && res.data) {
              this.errMsg = res.data.msg
              this.showFreshBtn = false;
            } else {
              this.showFreshBtn = false;
            }
          })
    },
    initWebsocket() {
      this.websocket = new WebSocketClient(this.appid, this.accessToken, this.refreshToken, this.expiresIn)
      this.websocket.connect((...args) => {
        console.log('emit', args, args.length);
        // let trans = args[0];

      }, (...args) => {
        console.log(args)
        //message
      }, (...args) => {
        console.log(args)
        //json
      }, (...args) => {
        //connect
        console.log('connected ~', args);
        this.wsConnected = true
        // websocket.sendTx('metis', 1337);
        // websocket.confirmTx('metis', 1337, 'add', [1, 2]);
        // websocket.queryTx(1337, '0x3417ff3086882bc95e0efa246e21fee1d30bb5f18ed65925d5dc005dbb4e33cd');

      }, () => {
        this.wsConnected = false
        //disconnect
        console.log('disconnect !')
      });
    },
    initHttpClient() {
        this.oauth2Client = new Oauth2Client(this.apiHost);
        this.httpclient = new HttpClient(this.appid, this.accessToken, this.refreshToken, this.expiresIn,this.apiHost,this.bridgeMetaMask);
    },
    handleCallContract() {
      if (!this.wsConnected) {
        alert('websocket disconnect')
        return;
      }

      this.websocket.sendTx('ystoken', 1337, 'transfer', ['0x1A13daA398B3030B8d0cE5d44d4E8C2bbe4585a3', 1000])
      // this.websocket.sendTx('ystoken', 1337, 'balanceOf', ['0x497D4c0457aedd62a1cb381F86e0DAbf0f2aAB10'])
    },
    async handleCallContractByHttp() {
      if (!this.httpclient) {
        alert('httpclient not init')
        return;
      }
      let args = null;

      if (this.contract.args.length > 0)
        args = this.contract.args.split(",");
      const value = this.value;
      this.httpclient.sendTxAsync(
          this.contract.domain,
          parseInt(this.chainid),
          this.contract.method,
          args, false, {value}).then((trans) => {
        this.contract.result = JSON.stringify(trans);
      }, (reject) => {
        this.contract.result = "reject:" + JSON.stringify(reject);
        console.log("reject:" + JSON.stringify(reject))
      })
      // this.httpclient.sendTx('ystoken', 1337, 'balanceOf', ['0x497D4c0457aedd62a1cb381F86e0DAbf0f2aAB10'])
    },
    async handleCallestimateGas() {
      if (!this.httpclient) {
        alert('httpclient not init')
        return;
      }
      let args = null;

      if (this.contract.args.length > 0)
        args = this.contract.args.split(",");
      this.httpclient.estimateGasAsync(
          this.contract.domain,
          parseInt(this.chainid),
          this.contract.method,
          args).then((trans) => {
        this.contract.result = JSON.stringify(trans);
      }, (reject) => {
        this.contract.result = "reject:" + JSON.stringify(reject);
        console.log("reject:" + JSON.stringify(reject))
      })
      // this.httpclient.sendTx('ystoken', 1337, 'balanceOf', ['0x497D4c0457aedd62a1cb381F86e0DAbf0f2aAB10'])
    },
    getBalance() {
      let dom = this;
      this.httpclient.getBalance(this.chainid, this.balanceAddress).then(res => {
        this.balance = (res);
        console.log("balance:" + this.balance)
      }, res => {
        console.log("get balance error:", res)
      })
    },
    async getUserInfo() {
      await this.oauth2Client.getUserInfoAsync(this.accessToken).then(res => {
        this.userInfo = JSON.stringify(res);
        console.log("user info:" + this.userInfo)
      })
    },
    getLogs() {
      this.result = "";
      this.logs.chainid = this.chainid;
      this.httpclient.getLogsAsync(this.logs).then(res => {
        console.log(res)
        this.result = JSON.stringify(res);
        ;

      })
    },
    getLogsByTxHash() {
      this.result = "";
      this.logs2.chainid = this.chainid;
      console.log("request data:" + this.logs2)
      this.httpclient.getTxLogsAsync(this.logs2).then(res => {
        this.result = JSON.stringify(res);
        console.log(res);
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
    async testDAC(){

      const addresss=['0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4','0xA35f56ebF874Df1B6aC09E72528e1a86D4F1EF2B']
      const data = ethers.utils.defaultAbiCoder.encode(
          ["string", "string", "string", "bool", "string", "string"],
          ["id12345", "name12345", "logo12345", true, "", ""],
      );
      // const data = '0x00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000000870306a3669387431000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c6e616d6570306a36693874310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c6c6f676f70306a36693874310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001064657363206f662070306a3669387431000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006746573742c350000000000000000000000000000000000000000000000000000';

      const result = await this.httpclient.sendTxAsync(
          'testdac',
           588,
          'createDAC',
          [addresss, 2, data],
          false
      );
     // this.contract.result =  daiContract2?.createDAC(addresss,1,data);
    },
    addToken() {
      // this.httpclient.addTokenToMM({
      //   token: "LXQ",
      //   tokenAddress: "0x8E1De235c879ca7b6BDA3Df8c16E42f8eB1Da8d1",
      //   tokenDecimals: 18,
      //   tokenImage: "https://polis.metis.io/static/img/polis-trans.9c0be85f.png",
      //   chainId:4
      // }).then(res => {
      //   console.log("add success ", res)
      // })
      // .catch(err => {
      //   console.log("add failed", err)
      // })

      this.httpclient.addTokenToMM(
        "LXQ",
        "0x8E1De235c879ca7b6BDA3Df8c16E42f8eB1Da8d1",
        18,
         "https://polis.metis.io/static/img/polis-trans.9c0be85f.png",4
      )
        .then(res => {
          console.log("add success ", res)
        })
        .catch(err => {
          console.log("add failed", err)
        })
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
