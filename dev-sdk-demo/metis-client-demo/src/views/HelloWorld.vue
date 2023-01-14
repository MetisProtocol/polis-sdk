<script setup>

defineProps({
  msg: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="greetings">
    <h1 class="green">{{ msg }}</h1>
    <h3>
      You’ve successfully created a project with
      <a target="_blank" href="https://vitejs.dev/">Vite</a> +
      <a target="_blank" href="https://vuejs.org/">Vue 3</a>.
    </h3>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2.6rem;
  top: -10px;
}

h3 {
  font-size: 1.2rem;
}

.greetings h1,
.greetings h3 {
  text-align: center;
}

@media (min-width: 1024px) {
  .greetings h1,
  .greetings h3 {
    text-align: left;
  }
}
</style>

<script>
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client/core";

import gql from "graphql-tag";

const TOPTENUSER_RANKING = gql`
  query MyQuery {
    userEntities(first: 10, orderBy: badgeCount, orderDirection: desc) {
      ranking
      rp
      badgeCount
      id
      socialName
      socialUri
  }
}
`;

const GRAPHQL_URI =
  "https://graphnode-graphql.staging.metisdevops.link/subgraphs/name/metis-gallery";

export default ({
  name: "Hello,world",
  async mounted() {
    const httpLink = createHttpLink({
      uri: GRAPHQL_URI,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });

    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: httpLink,
      defaultOptions: {
        watchQuery: {
          fetchPolicy: "no-cache",
          errorPolicy: "ignore",
        },
        query: {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        },
      },
    });

    const sleep = () => {
      return new Promise((res) => setTimeout(res, 200));
    };
    const q = async () => {
      for (let i = 0; i < 100; i++) {
        const result = await client.query({
          query: TOPTENUSER_RANKING,
        });
        console.log(result);
        await sleep();
      }
    };
    q().catch(console.log);
  },
});
</script>
