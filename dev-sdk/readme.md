# Polis dev sdk

Polis dev sdk contains Oauth2Client, HttpClient

## Sdk install
```
npm install --save-dev @metis.io/middleware-client
```

## Oauth2 client

### import & create
```
    import { Oauth2Client } from '@metis.io/middleware-client'

    let oauth2Client = new Oauth2Client()
```

### start oauth
```javascript
/**
 * switchAccount = true:  Does not automatically log in,default:false
 * newWindow: default false
 */

oauth2Client.startOauth2(`APPID`, `RETURN URL`, `newWindow`,`switchAccount`); 
```
The `APPID` and `RETURN URL` can get from Polis Developer User page

### request access token & refresh token on RETURN URL page in backend
```
    get(`https://polis.metis.io/api/v1/oauth2/access_token?app_id=${this.appid}&app_key=${this.appsecret}&code=${this.code}`)

    // if success
    res => {
        if (res.status == 200 && res.data && res.data.code == 200) {
          // res.data.data.access_token
          // res.data.data.refresh_token
          // res.data.data.expires_in
        }
    }      
```

### refresh token
```
    const oauth2User = await oauth2Client.refreshTokenAsync(`APPID`, `RefreshToken`)
```

### get user info
```
    const userInfo = await oauth2Client.getUserInfoAsync(`AccessToken`)

    // user info struct {
        'display_name': '',
        'username': '',
        'email': '',
        'eth_address': '',
        'last_login_time': timestamp
    }
```

### oauth logout
```javascript
 logout(appId:string, accessToken:string, refreshToken:string).then(res=>{
    //res = {
    //     status: 0
    //     msg: ""
    // }
})
.catch(res=>{
    // res = {
    //     status: 100003
    //     msg: ""
    // }
})
```


## Http client

### import & create
```
    import { HttpClient } from '@metis.io/middleware-client'

    let httpClient = new HttpClient(`appid`, `accessToken`, `refreshToken`, `expiresIn`)
```

### send transaction
```javascript
//    disableTooltip:  if DISABLE_TOOLTIP = true, sdk will not show error and success message at right top on page
 // EXTEND_PARAMS = {
//    value: '0'

// }
    httpClient.sendTxAsync().(`DOMAIN`, `CHAIN_ID`, `FUNCTION_NAME`, ARGUMENTS, DISABLETOOLTIP?, EXTEND_PARAMS?).then((trans) => {
        if(!trans) {
          return
        }
        console.log(trans)
    })

    // trans struct 
    {
        'tx': '0x00 is PURE or VIEW function call, otherwise is transaction hash'
        "status":"IN_PROGRESS", // IN_PROGRESS：success; SERVER_ERROR:the transaction was submitted successfully. but the application is having trouble with tracking the transaction status. 
        "chainid":4,
        "domain":
        "erc20",
        "data":"ok",
        "act":"CREATE"
    }
```
   
###

### estimateGasAsync
```javascript
 /*
 EXTEND_PARAMS = {
    value: '0'
    disableTooltip:  if DISABLE_TOOLTIP = true, sdk will not show error and success message at right top on page
  }
}*/
httpClient.estimateGasAsync(`DOMAIN`, `CHAIN_ID`, `FUNCTION_NAME`, ARGUMENTS, DISABLETOOLTIP?, EXTEND_PARAMS?)
    .then((trans) => {
            if(!trans) {
            return
            }
            console.log(trans)
})
//trans struct
{
    "act": "SIGN",
    "args": [
        "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4",
        "100000000"
        ],
    "chainid": 4,
    "contract_address": "0x8e1de235c879ca7b6bda3df8c16e42f8eb1da8d1",
    "data": "ok",
    "domain": "test1",
    "eth_address": "0xf1181bd15E8780B69a121A8D8946cC1C23972Bd4",
    "fee": "0.00003637 Metis",
    "fee_num": "0.00003637",
    "func_abi_sign": "function transfer(address recipient,uint256 amount) nonpayable returns (bool )",
    "function": "transfer",
    "gas": "33060",
    "gas_price": "1099995892 wei",
    "gas_price_num": "1099995892",
    "nonce": 0,
    "wallet": ""
}
```

### query transaction
```
    // if DISABLE_TOOLTIP = true, sdk will not show error and success message at right top on page
    httpClient.queryTxAsync(`CHAIN_ID`, `TX_HASH`, DISABLE_TOOLTIP?).then((trans) => {
        if(!trans) {
            return
        }
        console.log(trans)
    })

    // trans struct {
        'tx',
        'status',
        'chainid',
        'domain'
    }
```
### get balance
```
 httpClient.getBalance(`CHAIN_ID`).then((trans) => {
        console.log(balance)
    })
```
### get logs
```
// if DISABLE_TOOLTIP = true, sdk will not show error and success message at right top on page
    let data = {
      chainid:1337,
      fromBlock:'0x0',
      toBlock:'0x1',
      topics:[]
    }
    httpClient.getLogsAsync(data).then((result) => {
        console.log(result)
    })

    // result struct 
    [
        {
            "address": "0xDAb9Be5000000dFCA80C745415A07e828762",
            "blockHash": "0xf76f794bd3504df1f000000099b305e66efa244b58abd50bf322f707909fbf",
            "blockNumber": 1,
            "data": "0x0000000000000000000000000000000000000000204fce5e3e25026110000000",
            "logIndex": 0,
            "removed": false,
            "topics": [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x000000000000000000000000507d2c5444be42a5e7bd599bc370977515b7353f"
            ],
            "transactionHash": "0x43be081eb815b68ba4f72790448de1f36c51fb7cb9a1a92802d4266b1345a75f",
            "transactionIndex": 0
        }
      ]
```

### get logs by txhash
```
// if DISABLE_TOOLTIP = true, sdk will not show error and success message at right top on page
    let data = {
      chainid:1337,
      txhash:'0xf76f794bd3504df1f000000099b305e66efa244b58abd50bewe'
    }
    httpClient.getTxLogsAsync(data).then((result) => {
        console.log(result)
    })
    // result struct 
    [
        {
            "address": "0xDAb9Be5000000dFCA80C745415A07e828762",
            "blockHash": "0xf76f794bd3504df1f000000099b305e66efa244b58abd50bf322f707909fbf",
            "blockNumber": 1,
            "data": "0x0000000000000000000000000000000000000000204fce5e3e25026110000000",
            "logIndex": 0,
            "removed": false,
            "topics": [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                "0x0000000000000000000000000000000000000000000000000000000000000000",
                "0x000000000000000000000000507d2c5444be42a5e7bd599bc370977515b7353f"
            ],
            "transactionHash": "0x43be081eb815b68ba4f72790448de1f36c51fb7cb9a1a92802d4266b1345a75f",
            "transactionIndex": 0
        }
      ]
```

### get Domain
```
 httpClient.getDomain(`DOMAIN_NAME`,`CHAIN_ID`).then((trans) => {
        /**
        {
                "chainid": "435",
                "contract_address": "0x8e1de235c87rewrewredf8c16e42f8eb1da8d1",
                "name": "test1"
            }
        */
        console.log(balance)
        
    })
```

### providerCall

```javascript
/**
 *
 * @param param
 * {
 *     method: "get_block_number",  //method name
 *     args: {}||[]                   //method args array
 *     chainid: 4,
 * }
 */
httpclient.providerCall(param).then(res => {
    /**
     *  {
     *      result: "9611837"
     *  }
     */
})
```

