<template lang="pug">
.el-card(:class="cardState === 'disable'? 'grey-mode' : ''", :style='{width: cardWidth, height: cardHeight, margin: "5px"}', :body-style='{ padding: "0px" }', @click="() => addTrade(data, cardState)")
  .d-flex.p-1.justify-content-end
    .float-right.p-1.bg-black.text-success # {{ mintNum }}
  .main-img(v-if='videoBackground')
    video(autoplay='true', loop='true', :class="['main-img']", :style='{width: imgWidth, height: imgHeight}')
      source(
        :src='"https://resizer.atomichub.io/videos/v1/preview?ipfs=" + videoBackground.video + "&size=370&output=mp4"',
        type='video/mp4'
      )
  .main-img(v-else-if='imageBackground')
    img(:src='imageBackground' :style='{width: imgWidth, height: imgHeight}')
  .main-img(v-else)
    img(
      src='~/assets/images/default.png', :style='{width: imgWidth, height: imgHeight}'
    )
  .d-flex.justify-content-between.align-items-center.p-3
    .pr-3 {{ collectionAbbrName }}
    .d-flex.align-items-center
      div.small.pr-1.text-secondary {{ immutableAbbrName }}
      img(src='~/assets/icons/check-circle.svg')
</template>
<script>

export default {
  props: {
    imgWidth: {
      default: '100%'
    },
    imgHeight: {
      default: '100%'
    },
    cardWidth: {
      default: '220px'
    },
    cardHeight: {
      default: '325px'
    },
    mintNum: {
      default: '0'
    },
    collectionName: {
      default: 'CandyLand'
    },
    immutableName: {
      default: 'Alcorex'
    },
    data: {
      search: '',
      default: {}
    },
    addTrade: {
      default: null
    },
    cardState: {
      default: 'enable'
    }
  },
  data() {
    return {
      currentDate: new Date(),
    }
  },
  computed: {
    videoBackground() {
      if (this.data && this.data.data && this.data.data.video) {
        return this.data.data
      } else return false
    },
    imageBackground() {
      if (this.data && this.data.data && this.data.data.img) {
        return this.data.data.img.includes('https://')
          ? this.data.data.img
          : 'https://resizer.atomichub.io/images/v1/preview?ipfs=' + this.data.data.img + '&size=370'
      } else return false
    },
    collectionAbbrName() {
      let abbrCollName = ''
      if (this.collectionName) {
        abbrCollName = this.collectionName
      } else abbrCollName = ''
      if (abbrCollName.length > 13) {
        return abbrCollName.substr(0, 3) + '...' + abbrCollName.substr(-1)
      } else return abbrCollName
    },
    immutableAbbrName() {
      let abbrImmuName = ''
      if (this.collectionName) {
        abbrImmuName = this.immutableName
      } else abbrImmuName = ''
      if (abbrImmuName.length > 8) {
        return abbrImmuName.substr(0, 3) + '...' + abbrImmuName.substr(-2)
      } else return abbrImmuName
    }
  }
}
</script>
<style lang="scss">
.grey-mode{
  filter: grayscale(1);
  border: solid 1px #67C23A !important;
  border-radius: 2px !important;
}
.main-img {
    height: 229.9px;
    object-fit: cover;
  }
.time {
  font-size: 13px;
  color: #999;
}

.bottom {
  margin-top: 13px;
  line-height: 12px;
}

.button {
  padding: 0;
  float: right;
}

.image {
  width: 100%;
  display: block;
}
</style>
