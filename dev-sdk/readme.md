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
```
   oauth2Client.startOauth2(`APPID`, `RETURN URL`); 
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


## Http client

### import & create
```
    import { HttpClient } from '@metis.io/middleware-client'

    let httpClient = new HttpClient(`appid`, `accessToken`, `refreshToken`, `expiresIn`)
```

### send transaction
    // if DISABLE_TOOLTIP = true, sdk will not show error and success message at right top on page
    httpClient.sendTxAsync().(`DOMAIN`, `CHAIN_ID`, `FUNCTION_NAME`, ARGUMENTS, DISABLE_TOOLTIP?).then((trans) => {
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
    }\
###

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