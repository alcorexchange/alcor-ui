<template>
  <div class="wallet-header alcor-card">
    <div class="item">
      <div class="title cancel">Portfolio value</div>
      <div class="value">
        <span class="main">1500.243</span>
        <span class="symbol cancel">WAX</span>
      </div>
      <div class="info cancel">= $229.11</div>
    </div>
    <div class="item">
      <div class="title cancel">Active positions</div>
      <div class="value">
        <span class="main">
          <span class="buy green">7 Buy</span>
          <span class="cancel">|</span>
          <span class="sell red">8 Sell</span>
        </span>
        <span class="symbol cancel">WAX</span>
      </div>
      <div class="info cancel">5 Pairs</div>
    </div>
    <div class="item">
      <div class="title cancel">Available funds</div>
      <div class="value">
        <span class="main">1500.243</span>
        <span class="symbol cancel">WAX</span>
      </div>
      <div class="info cancel">= $229.11</div>
    </div>
    <div class="item">
      <div class="title cancel">Staking rewards</div>
      <div class="value">
        <span class="main">1500.243</span>
        <span class="symbol cancel">WAX</span>
      </div>
      <div class="info cancel">Last Claim: 0.00005</div>
    </div>
    <div class="item">
      <div class="title cancel">LP rewards</div>
      <div class="value">
        <span class="main green">+17.382</span>
        <span class="symbol cancel">WAX</span>
      </div>
      <div class="info cancel">2 Liquidity Pools</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WalletHeader'
}
</script>

<style scoped lang="scss">
.main {
  font-size: 1.1rem;
  font-weight: 500;
}
.title,
.value,
.info {
  padding: 2px;
}
.wallet-header {
  display: flex;
  justify-content: space-between;
}
</style>
