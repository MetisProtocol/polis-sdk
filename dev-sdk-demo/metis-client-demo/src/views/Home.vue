<template>
  <div class="home">
    <div>
      This is a metis demo
    </div>
    <div>
      switchAccount:<el-switch
          v-model="switchAccount"
          active-color="#13ce66"
          inactive-color="#ff4949">
      </el-switch>
    </div>
    <div>
     DAPP PRE AUTH CODE: <el-input style="width: 300px" v-model="pre_code"/>
    </div>
    <div style="margin-top: 20px;">

      <el-button type="primary" @click="startOauth2">Start oauth2</el-button>
    </div>
    <br/>
    <div>
      <div><h2>Polis Client Demo</h2></div>
      <div>
        <div>Web3Provider not with Token</div>
        <div>
          <div>address:<el-input style="width: 300px" v-model="address"/> <el-button type="primary" @click="clientGetBalance">getBalance</el-button></div>

        </div>
      </div>
      <br/>
      <div>
        <el-button type="primary" @click="startOauth2New">Polis Client Start oauth2</el-button>
      </div>
    </div>

    <br/>
    <div>
      <el-button type="primary" @click="startOauth2WC">Polis Client WalletConnect</el-button>
      <el-button type="primary" @click="testIframe(apiHost)">testIframe</el-button>
      <el-button type="primary" @click="testIframe('https://me.qa.nuvosphere.io')">testIframe2</el-button>

      <el-button type="primary" @click="postMessage">RN post message</el-button>
      <el-button type="primary" @click="openWin">openWin</el-button>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import {Oauth2Client, WebSocketClient} from '@metis.io/middleware-client'
import {PolisClient} from '@metis.io/middleware-client'
import Swal from 'sweetalert2';

export default {
  name: 'Home',
  components: {},
  data() {
    return {
      appId: process.env.VUE_APP_APP_ID,
      // appId:"611cc74139481700e8885bc5", //polis
      returnUrl: process.env.VUE_APP_RETURN_URL,
      returnUrl2: process.env.VUE_APP_RETURN_URL2,
      apiHost: process.env.VUE_APP_API_HOST,
      oauthHost:process.env.VUE_APP_TOKEN_URL,
      switchAccount: false,
      chainId:4,
      pre_code:"",
      polisclient:null,
      address:"0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4"
    }
  },
  mounted() {
    // console.log(Oauth2Client, WebSocketClient)
    const opts = {
      appId:this.appId,
      chainId:this.chainId,
      // apiHost: "https://polis-test.meits.io",
      apiHost: this.apiHost,
      oauthHost: this.oauthHost,
    }
    this.polisclient = new PolisClient(opts);
    this.polisclient.on('debug',function (data){
      console.log("debug",data)
    })
    const test = function(event) {
      console.log('receive document', event)
    }
    const test2 = function(event) {
      console.log('receive window', event)
    }
    document.removeEventListener('message', test);
    document.addEventListener('message', test);
    window.removeEventListener('message', test2);
    window.addEventListener('message', test2);
    // this.openWin()
  },
  methods: {
    openWin() {
      window.open('https://www.baidu.com')
    },
    postMessage() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'ERROR', code: 1000, message: 'CANCEL' }))
    },
    startOauth2() {
      console.log(this.appId);
      let oauth2Client = new Oauth2Client(this.apiHost);
      oauth2Client.startOauth2(this.appId, this.returnUrl, false, this.switchAccount);

    },
    savePreCode(){
      localStorage.setItem("precode",this.pre_code)
    },
    startOauth2New() {
      this.savePreCode();
      // let oauth2Client = new Oauth2Client();
      // if(process.env.NODE_ENV =="dev"){
      //   oauth2Client = new Oauth2Client("test");
      // }
      // oauth2Client.startOauth2(this.appId, this.returnUrl,false,this.switchAccount);
      // polis url. polis.metis.io  polis-test.metiis.io

      const authOps = {
        appId: this.appId,
        returnUrl: this.returnUrl2,
        switchAccount: this.switchAccount
      }
      console.log("authOps:",authOps)
      //user login auth
      this.polisclient.startOauth2(authOps);
    },
    startOauth2WC() {
      this.savePreCode();
      const authOps = {
        appId: this.appId,
        returnUrl: "http://localhost:8000/#/wc",
        switchAccount: this.switchAccount
      }
      //user login auth
      this.polisclient.startOauth2(authOps);
    },
    clientGetBalance() {
      this.polisclient.web3Provider.getBalance(this.address).then( res => {
        alert(res)
      }).catch((err)=>{
        console.log("err:",err);
        alert(err)
      })
    },
    testIframe(host=this.apiHost) {
      // open a dialog
      // alert(host)
      let width = 720;
      let height = 480;
      const confirmUrl = host

      const dialog = Swal.mixin({
        customClass:{
          container: 'nuvo-test-swal2-container'
        },
        showClass: {
          popup: 'nuvo-test-swal2-show',
        }
      });
      const confirmWin = dialog.fire({
        title: '<span style="font-size: 24px;font-weight: bold;color: #FFFFFF;font-family: Helvetica-Bold, Helvetica">Request Confirmation</span>',
        html: `<iframe src="${confirmUrl}" style="width: 100%; height: ${height}px;" frameborder="0" id="metisConfirmIframe"></iframe>`,
        width: `${width}px`,
        showConfirmButton: false,
        background: '#3A1319',
        didOpen: (dom) => {
          document.getElementById('metisConfirmIframe').onload = function () {
            // (document.getElementById('metisConfirmIframe') as HTMLIFrameElement).contentWindow!.postMessage(transObj, confirmUrl.split('/#')[0]);
            console.log("token:",document.cookie['token'])
          };
        },
        didClose: () => {
          window.postMessage({status: 'ERROR', code: 1000, message: 'CANCEL'}, window.location.origin);
        },
      });
      const self = this;
      return new Promise((resolve, reject) => {
        function globalMessage(event) {

        }

        window.addEventListener('message', globalMessage, false);
      });
    }
  }
}
</script>
