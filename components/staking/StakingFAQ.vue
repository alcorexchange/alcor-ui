<template lang="pug">
.staking-faq
  ElCollapse(v-model="active" accordion)
    ElCollapseItem(v-for="item in items"  :name="item.name")
      template(#title)
        span.p-3 {{ item.title }}
      p.p-3 {{ item.description }}
</template>

<script>
export default {
  name: 'StakingFAQ',
  data: () => ({
    active: undefined,
  }),
  computed: {
    items() {
      return [
        {
          title: 'What is Liquid Staked WAX ($LSW)?',
          description:
            "Liquid Staked WAX ($LSW) is Alcor DEX's innovative solution enabling users to stake WAX tokens and receive $LSW, a liquid token. This process allows participants to earn staking rewards while maintaining liquidity and flexibility, facilitating active participation in DeFi applications without locking their assets.",
          name: '1',
        },
        {
          title: 'How does liquid staking work on Alcor DEX?',
          description:
            "The process begins when a user stakes WAX by depositing it into the Alcor Staking Contract. The contract then calculates the amount of $LSW to mint based on the current exchange rate of WAX, mints $LSW, and credits it to the user's account. This $LSW can then be used across various DeFi platforms.",
          name: '2',
        },
        {
          title: 'What are the benefits of staking WAX for $LSW?',
          description:
            "Staking WAX for $LSW enhances liquidity and flexibility, allowing users to engage in DeFi applications with their staked assets. It improves the WAX blockchain's network security by incentivizing broader participation in staking. Additionally, it introduces a more capital-efficient model for both blockchain projects and DeFi applications, circumventing the need for frequent claims and voting.",
          name: '3',
        },
        {
          title: 'Can you explain the technical process of staking and minting $LSW?',
          description:
            "Upon initiation, a user's WAX is deposited into the Alcor Staking Contract. The contract calculates the $LSW to be minted based on the WAX's exchange rate. After minting, $LSW is sent to the user's account. The Alcor contract then stakes WAX across the top 21 Guilds using a Grantee’s account, ensuring a uniform distribution and participation in governance.",
          name: '4',
        },
        {
          title: 'How is the exchange rate between $LSW and WAX calculated?',
          description:
            'The exchange rate starts at a 1:1 ratio and is dynamically updated to reflect accrued staking rewards, maintaining fairness and accuracy in the representation of staked assets. The formula considers the total native WAX (staked plus rewards) against the total $LSW minted.',
          name: '5',
        },
        {
          title: 'What happens when I want to withdraw my staked WAX?',
          description:
            'Users can opt to withdraw their WAX, subject to a 3-day unbonding period as mandated by WAX, or swap their $LSW for WAX instantly on Alcor or other listed DEXes for immediate access to their assets.',
          name: '6',
        },
        {
          title: 'What fees are associated with staking WAX for $LSW?',
          description:
            'Alcor Protocol imposes a 10% fee on all staking rewards earned by $LSW holders. This fee is allocated to a treasury contract to support the development, incentivize users and validators, provide insurance against slashing events, and sustain the Alcor ecosystem.',
          name: '7',
        },
        {
          title: 'How does staking WAX for $LSW improve network security and capital efficiency?',
          description:
            'By encouraging a broader base of token holders to stake, the overall security of the WAX blockchain is enhanced. The liquid staking model provided by $LSW ensures capital efficiency by allowing staked assets to participate in DeFi activities without the need for constant claiming and voting, optimizing both the utility of staked assets and the governance process.',
          name: '8',
        },
      ]
    },
  },
}
</script>

<style scoped lang="scss">
.staking-faq {
  &::v-deep {
    .el-collapse {
      border-radius: 8px;
      overflow: hidden;
    }
    .el-collapse-item__header {
    }
  }
}
</style>
