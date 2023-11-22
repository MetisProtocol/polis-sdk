<template>
  <div class="about">
    <h1>This is an test page Polis-Client {{ this.accessToken }}</h1>
    <div style="margin-top: 20px;">
      <div v-if="errMsg" style="color: red;">{{ errMsg }}</div>
    </div>
    <div>
      <div v-if="accessToken">
        <el-button type="primary" @click="disconnect">DisConnect</el-button>
        <el-button type="primary" @click="signer">signer</el-button>
        <el-button type="primary" @click="postRequest">Test API</el-button>
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
              <el-button type="primary" @click="callContractPayable">contract Payable Method
              </el-button>
              <el-button type="primary" @click="mint">Mint Badge
              </el-button>
              <el-button type="primary" @click="blstx">BLS Test
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
              <el-button type="primary" @click="getBadgeToken">contract token check
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
import { Aggregator } from 'bls-wallet-clients';
import { BlsWalletWrapper } from 'bls-wallet-clients';

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
      oauthHost: process.env["VUE_APP_TOKEN_URL"],
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
      chainid: 599,
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
        address: "0x70E45aD1d427532d8E7A86bC2037be0fd00e4829",
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
      console.log("oauthHost:",this.oauthHost)
      this.polisclient = new PolisClient({
        appId: this.appid,
        chainId: this.chainid,
        apiHost: this.apiHost,
        oauthHost: this.oauthHost+"/",
        // useNuvoProvider: true
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
      axios.get(process.env.VUE_APP_API_HOST + `/api/v1/oauth2/refresh_token?app_id=${this.appid}&app_key=${this.appsecret}&refresh_token=${refresh_token}`)
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
    getBadgeToken(){
      const contract = "0x54123f9d5e328b06a9898b9f9bfda363c595deef"
      axios.get(process.env.VUE_APP_API_HOST + `/api/v1/oauth2/badge/token?contract=${contract}&address=0x01ac2804797cf9533f643815c226b1d4f1ebd73c`,{headers:{"Access-Token":this.accessToken} })
          .then(res => {
            console.log(res.data)
            this.result = JSON.stringify(res.data);
          });
    },
    getAccessToken() {
      if (!this.code) {
        return
      }
      // axios.get(`https://polis.metis.io/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}`)
      axios.get(process.env.VUE_APP_API_HOST + `/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}&pre_auth_code=${this.pre_auth_code}`)
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
      // const provider = new ethers.providers.JsonRpcProvider("https://stardust.metis.io/?owner=599");
      // const daiContract2 = new ethers.Contract(daiAddress, daiAbi, provider);
      this.contract.result += "|" + await daiContract2.name();

    },

    async mint() {

      // 720 prod bls check
      // this.polisclient.changeChain(this.chainid);
      // await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask)
      // let daiAddress = "0xC8B1bb2fe588d84A4b9FC09Ab4e32CB03C32A173";
      // let daiAbi = ['function mint(address to, uint amount) returns (bool)'];
      // let daiContract2 = this.polisclient.getContract(daiAddress, daiAbi);
      // this.contract.result =JSON.stringify( await daiContract2.mint('0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4', ethers.utils.parseUnits('0.1', 18)));

      // 721
      // this.polisclient.changeChain(this.chainid);
      // await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask)
      // let daiAddress = "0x1F9C4B9F3D04f2E47D4dc462CaD7D2FB081d4E6d";
      // let daiAbi = ['function safeMint(address _to, uint256 _tokenId)'];
      // let daiContract2 = this.polisclient.getContract(daiAddress, daiAbi);
      // this.contract.result =JSON.stringify( await daiContract2.safeMint('0x354c6e41EFb6c70dd0810C14E72f89fbdd070D90', ethers.utils.parseUnits('1', 18)));


      // this.polisclient.changeChain(this.chainid);
      // await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask)
      // let daiAddress = "0x5eB4d7393dCcFA37172870D56c15fc1A1C597627";
      // let daiAbi = ['function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
      //             'function RP(uint256 tokenId) view returns (int256)',
      //             'function addSentiveWord(bytes32 name)',
      //             'function approve(address to, uint256 tokenId, bool authorize)',
      //             'function balanceOf(address owner) view returns (uint256)',
      //             'function burn(uint256 tokenId)',
      //             'function checkSensitiveWord(bytes32 name) view returns (bool)',
      //             'function claim(bytes32[] proof, bytes32 name_)',
      //             'function claimByCode(bytes key, bytes32[] proof, bytes32 name_)',
      //             'function data(uint256 tokenId) view returns (tuple(bytes name, int256 rp, uint256 tokenId, bytes tokenUri, bytes data, bytes datahash, uint8 nftType))',
      //             'function getBadges(uint256 tokenId) view returns (address[])',
      //             'function getRoleAdmin(bytes32 role) view returns (bytes32)',
      //             'function grantRole(bytes32 role, address account)',
      //             'function hasRole(bytes32 role, address account) view returns (bool)',
      //             'function initialize(string name_, string symbol_)',
      //             'function isApprovedOrManager(uint256 tokenId, address spender) view returns (bool)',
      //             'function mint(address to, bytes32 name_)',
      //             'function mintToSender(bytes32 name_)',
      //             'function mintData(uint256 tokenId, bytes data, bytes dataHash)',
      //             'function name() view returns (string)',
      //             'function owner() view returns (address)',
      //             'function ownerOf(uint256 tokenId) view returns (address)',
      //             'function proxiableUUID() view returns (bytes32)',
      //             'function renounceOwnership()',
      //             'function renounceRole(bytes32 role, address account)',
      //             'function revokeRole(bytes32 role, address account)',
      //             'function setBaseURI(bytes base_url_)',
      //             'function setLimitedSupply(uint256 _supply)',
      //             'function setManager(address operator, bool approved)',
      //             'function setWhiteListHash(bytes32 hash)',
      //             'function supportsInterface(bytes4 interfaceId) view returns (bool)',
      //             'function symbol() view returns (string)',
      //             'function tokenId(address sender) view returns (uint256)',
      //             'function tokenName(uint256 tokenId) view returns (string)',
      //             'function tokenURI(uint256 tokenId) view returns (string)',
      //             'function transferOwnership(address newOwner)',
      //             'function updateRP(uint256 tokenId, address to, int256 value, address badge)',
      //             'function upgradeTo(address newImplementation)',
      //             'function upgradeToAndCall(address newImplementation, bytes data) payable',
      //             'function version() pure returns (string)',
      //             'function SocialRP(uint256 tokenId) public view  returns (int256)',
      //             'function mintSocialRP() public',
      //             'function setRegularSupply(uint256 _supply)'];
      // let daiContract2 = this.polisclient.getContract(daiAddress, daiAbi);
      // // this.contract.result =JSON.stringify( await daiContract2.setRegularSupply(ethers.utils.parseUnits('1000', 18)));
      // // this.contract.result =JSON.stringify( await daiContract2.mint('0x013369bFF7dd28b03Fb16d1e11e8da77c73c74d9', ethers.utils.formatBytes32String("soci12Namerf8ii")));
      // this.contract.result =JSON.stringify( await daiContract2.mintToSender(ethers.utils.formatBytes32String("soci12Namerf8ii")));
      // this.contract.result =JSON.stringify( await daiContract2.balanceOf('0xbcFD6825a81A8A58f997EA7E33ef21268A774B64'));

      this.polisclient.changeChain(this.chainid);
      await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask)
      let daiAddress = "0x5eB4d7393dCcFA37172870D56c15fc1A1C597627";
      let daiAbi = ['function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
                  'function RP(uint256 tokenId) view returns (int256)',
                  'function addSentiveWord(bytes32 name)',
                  'function approve(address to, uint256 tokenId, bool authorize)',
                  'function balanceOf(address owner) view returns (uint256)',
                  'function burn(uint256 tokenId)',
                  'function checkSensitiveWord(bytes32 name) view returns (bool)',
                  'function claim(bytes32[] proof, bytes32 name_)',
                  'function claimByCode(bytes key, bytes32[] proof, bytes32 name_)',
                  'function data(uint256 tokenId) view returns (tuple(bytes name, int256 rp, uint256 tokenId, bytes tokenUri, bytes data, bytes datahash, uint8 nftType))',
                  'function getBadges(uint256 tokenId) view returns (address[])',
                  'function getRoleAdmin(bytes32 role) view returns (bytes32)',
                  'function grantRole(bytes32 role, address account)',
                  'function hasRole(bytes32 role, address account) view returns (bool)',
                  'function initialize(string name_, string symbol_)',
                  'function isApprovedOrManager(uint256 tokenId, address spender) view returns (bool)',
                  'function mint(address to, bytes32 name_)',
                  'function mintToSender(bytes32 name_)',
                  'function mintData(uint256 tokenId, bytes data, bytes dataHash)',
                  'function name() view returns (string)',
                  'function owner() view returns (address)',
                  'function ownerOf(uint256 tokenId) view returns (address)',
                  'function proxiableUUID() view returns (bytes32)',
                  'function renounceOwnership()',
                  'function renounceRole(bytes32 role, address account)',
                  'function revokeRole(bytes32 role, address account)',
                  'function setBaseURI(bytes base_url_)',
                  'function setLimitedSupply(uint256 _supply)',
                  'function setManager(address operator, bool approved)',
                  'function setWhiteListHash(bytes32 hash)',
                  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
                  'function symbol() view returns (string)',
                  'function tokenId(address sender) view returns (uint256)',
                  'function tokenName(uint256 tokenId) view returns (string)',
                  'function tokenURI(uint256 tokenId) view returns (string)',
                  'function transferOwnership(address newOwner)',
                  'function updateRP(uint256 tokenId, address to, int256 value, address badge)',
                  'function upgradeTo(address newImplementation)',
                  'function upgradeToAndCall(address newImplementation, bytes data) payable',
                  'function version() pure returns (string)',
                  'function SocialRP(uint256 tokenId) public view  returns (int256)',
                  'function mintSocialRP() public'];
      let daiContract2 = this.polisclient.getContract(daiAddress, daiAbi);
      // this.contract.result =JSON.stringify( await daiContract2.mint('0xbcFD6825a81A8A58f997EA7E33ef21268A774B64', ethers.utils.formatBytes32String("socialNamerftestbls")));
      this.contract.result =JSON.stringify( await daiContract2.mintToSender(ethers.utils.formatBytes32String("soci12Namerf8ii")));


      // const badge_abi = [
      //   'function ADMIN_ROLE() view returns (bytes32)',
      //   'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
      //   'function MANAGER_ROLE() view returns (bytes32)',
      //   'function appId() view returns (bytes)',
      //   'function approveBadge(address to)',
      //   'function balanceOf(address owner) view returns (uint256)',
      //   'function burn(uint256 tokenId)',
      //   'function claim(bytes32[] proof, bytes data)',
      //   'function claimByCode(bytes code, bytes32[] proof, bytes data)',
      //   'function endTime() view returns (uint256)',
      //   'function getRoleAdmin(bytes32 role) view returns (bytes32)',
      //   'function grantRole(bytes32 role, address account)',
      //   'function hasRole(bytes32 role, address account) view returns (bool)',
      //   'function level(uint256 tokenId) view returns (tuple(uint8 level, bytes data, uint256 rp, bytes uri))',
      //   'function mint(address to, bytes data)',
      //   'function mintData(uint256 tokenId, bytes data)',
      //   'function name() view returns (string)',
      //   'function owner() view returns (address)',
      //   'function ownerOf(uint256 tokenId) view returns (address)',
      //   'function renounceOwnership()',
      //   'function renounceRole(bytes32 role, address account)',
      //   'function revokeBadge(address to)',
      //   'function revokeRole(bytes32 role, address account)',
      //   'function rp() view returns (uint256[])',
      //   'function setAddressWhitelistHash(bytes32[] hashs, uint256[] levels_)',
      //   'function setBadgeManager(address _address)',
      //   'function setBadgeRegister(address _address)',
      //   'function setBaseURI(bytes base_url_)',
      //   'function setCodeWhitelistHash(bytes32[] hashs, uint256[] levels_)',
      //   'function setEndime(uint32 time_)',
      //   'function setMaxLevel(uint256 maxLevel)',
      //   'function setMintPermission(bool needOwner_)',
      //   'function setMutable(bool isMutable)',
      //   'function setNFTProperties(string name_, string symbol_, bytes base_uri_, uint256 supply, uint256[] rps_, bytes[] uris_)',
      //   'function setStartTime(uint32 time_)',
      //   'function startTime() view returns (uint256)',
      //   'function supportsInterface(bytes4 interfaceId) view returns (bool)',
      //   'function symbol() view returns (string)',
      //   'function tokenData(uint256 tokenId) view returns (bytes)',
      //   'function tokenId(address sender) view returns (uint256)',
      //   'function tokenLevel(uint256 tokenId) view returns (uint8)',
      //   'function tokenRP(uint256 tokenId) view returns (uint256)',
      //   'function tokenURI(uint256 tokenId) view returns (string)',
      //   'function totalSupply() view returns (uint256)',
      //   'function transferOwnership(address newOwner)',
      //   'function upgrade(bytes32[] proof, uint8 level_, bytes data_)',
      //   'function upgradeByCode(bytes code, bytes32[] proof, uint8 level_, bytes data_)',
      //   'function uris() view returns (bytes[])',
      //   'function verifyData(uint256 tokenId, bytes data, bytes signature) view returns (bool)',
      //   'function version() pure returns (string)'
      // ]
      // this.polisclient.changeChain(this.chainid);
      // await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask)
      // let daiAddress = "0x0eb2AdEd1Ff3C51deAA96a33851ab23df6a8cBe1";
      // let daiContract2 = this.polisclient.getContract(daiAddress, badge_abi);
      // // this.contract.result = await daiContract2.setMintPermission(false);
      // let toAddress = "0xbcFD6825a81A8A58f997EA7E33ef21268A774B64";
      // this.contract.result = JSON.stringify(await daiContract2.mint(toAddress, toAddress));
    },
    async blstx(){

        /**
         *
         */
        const aggregator = new Aggregator('http://127.0.0.1:3000');
        const privateKey = "0x46db1fbb6f87a490923b5782f609634c5ff5420abda4838858eaf1edcc82ff01"
        const verificationGatewayAddress = "0xe33D440C51D2F7cCDCbB1fEC41c5894503516318"
        const provider = new ethers.providers.JsonRpcProvider({
            // url: "http://localhost:1024/api/rpc/v1",
            url: "https://goerli.gateway.metisdevops.link"
        });
        const wallet = await BlsWalletWrapper.connect(
            privateKey,
            verificationGatewayAddress,
            provider,
        );
        const contracts = [
            '0x92152F728Aa3B41c2e4614e264D626DED7eBAC91',
            '0x88f8ff6c7259031303c146cb7caa3a24055cdbb7',
            '0x4726a8732a64f1ba73f67b2b00378869ab399d08',
            '0xf33a884a2be090ce6d0a3775f93ae8a37a9451a6'
        ]
        const contractAbi = {
            funcAbi:"function claimBadge(address badge,address to,bytes memory data)",
            function:"claimBadge",
            args:['0xbc3443409e992b8c379b7971e48e925ab2eb3ebc','0x0Fb3E4C40A8Ea7Abd4125438E84afD0991ab03de','0x']
        }

        const abiFace = new ethers.utils.Interface([contractAbi.funcAbi]);
        const encodedFunction = abiFace.encodeFunctionData(contractAbi.function,contractAbi.args);

        const workers = []
        const bundles = []
        console.log("await wallet.Nonce():",await wallet.Nonce())
        for(let i=0;i<contracts.length;i++){
            const contractAddr = contracts[i]
            const nonce = await wallet.Nonce();
            const new_nonce = nonce.add(ethers.BigNumber.from(i))
            const bundle = wallet.sign({
                nonce: new_nonce,
                actions: [
                    {
                        ethValue: 0,
                        contractAddress: contractAddr, // An ethers.Contract
                        encodedFunction: encodedFunction,
                    },
                    // Additional actions can go here. When using multiple actions, they'll
                    // either all succeed or all fail.
                ],
            });
            bundles.push(bundle)
        }
        for(let i=0;i<bundles.length;i++){
            console.log(bundles[i])
            aggregator.add(bundles[i])
                .then((res)=>{
                    console.log("bundle"+i,res)
                })
                .catch((e)=>{
                    console.log("bundle"+i +"error:",e)
                })
        }

    },
    async callContractPayable() {
     console.log( this.polisclient.oauthHost);
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
        await this.polisclient.connect(this.oauthInfo,this.bridgeMetaMask);

        const valueHex = '0x' + new BigNumber(this.ethTx.value).toString(16);
        const tx = {
          // from:"0xA35f56ebF874Df1B6aC09E72528e1a86D4F1EF2B",
          to: this.ethTx.to,
          value: valueHex,
          gasLimit: ethers.BigNumber.from("21000").toHexString()
        }
        this.loading();
        this.polisclient.web3Provider.getSigner().sendTransaction(tx).then(async res => {
          this.closeLoading();
          this.loading();
          //await res.wait()
          this.closeLoading();
          this.result = JSON.stringify(res);
          alert(this.result)
        }).catch((err) => {
          console.log("err:", err);
          this.closeLoading();
        });

        // this.polisclient.web3Provider.sendTransaction(tx).then(async res => {
        //   this.closeLoading();
        //   this.loading();
        //   //await res.wait()
        //   this.closeLoading();
        //   this.result = JSON.stringify(res);
        //   alert(this.result)
        // }).catch((err) => {
        //   console.log("err:", err);
        //   this.closeLoading();
        // });
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
      //start
      this.polisclient.web3Provider.getSigner().signMessage(this.message).then(res => {
        this.result = res;
      }).catch(err => {
        alert(err);
      })
      //end

    },
    async signer(){
      const signer =  await this.polisclient.web3Provider.getSigner();
      console.log("singer:",signer);
    },
    async sign(){

    },
    postRequest(){
      axios.delete("http://nuvo.test.com:1024/api/v1/oauth2/settings/app_permission2/60ed992bb520d95b454c4e88",{
        headers:{"access-token":this.accessToken}
      })
          .then(function (res){
              console.log("success..",res)
          })
          .catch(function (err){
            console.log("fail..",err)

          })
      // axios.get("http://nuvo.test.com:1024/api/v1/oauth2/settings/app_permissions",{
      //   headers:{"access-token":this.accessToken}
      // })
      //     .then(function (res){
      //       console.log("get success.",res)
      //     })
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
