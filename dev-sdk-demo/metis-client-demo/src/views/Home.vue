<template>
  <div class="home">
    <div>
      This is a metis demo
    </div>
    <div style="margin-top: 20px;">
      <el-switch
          v-model="switchAccount"
          active-color="#13ce66"
          inactive-color="#ff4949">
      </el-switch>
      <button type="button" @click="startOauth2">Start oauth2</button>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import { Oauth2Client, WebSocketClient } from '@metis.io/middleware-client'

export default {
  name: 'Home',
  components: {
  },
  data() {
    return {
      appId: process.env.VUE_APP_APP_ID,
        // appId:"611cc74139481700e8885bc5", //polis
      returnUrl: process.env.VUE_APP_RETURN_URL,
      switchAccount: false,
    }
  },
  mounted() {
      console.log("demo.dev ="  + process.env.NODE_ENV);

      console.log(Oauth2Client, WebSocketClient)``
  },
  methods: {
    startOauth2() {
      let oauth2Client = new Oauth2Client();
      if(process.env.NODE_ENV =="dev"){
           oauth2Client = new Oauth2Client("test");
      }
      oauth2Client.startOauth2(this.appId, this.returnUrl,false,this.switchAccount);

    },

  }
}
</script>
