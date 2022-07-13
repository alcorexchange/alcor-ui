<template lang="pug">
el-row
  el-col
    el-card(:body-style='{ padding: "0px" }')
      .d-flex.p-1.justify-content-end
        .float-right.p-1.bg-black.text-success # {{ mintNum }}
      p {{'video:' + video + ' img:' + img}}
      div(v-if='video')
        video(autoplay='true', loop='true', :width='imgWidth')
          source(
            :src='"https://resizer.atomichub.io/videos/v1/preview?ipfs=" + video.video + "&size=370&output=mp4"',
            type='video/mp4'
          )
      div(v-else-if='img')
        img(:src='img', :width='imgWidth')
      div(v-else)
        img(
          src='https://ipfs.atomichub.io/ipfs/QmVgw5njTjSLs8iSkoNGodk7maekhHvrXCdwjs6xxYMZk9',
          :width='imgWidth'
        )
      .d-flex.justify-content-between.align-items-center.p-3
        div {{ collectionName }}
        .d-flex.align-items-center
          .small.pr-1.text-secondary {{ immutableName }}
          img(src='~/assets/icons/check-circle.svg')
</template>
<script>
export default {
  props: {
    img: {
      // default: 'https://ipfs.atomichub.io/ipfs/QmVgw5njTjSLs8iSkoNGodk7maekhHvrXCdwjs6xxYMZk9'
      default: false,
    },
    video: {
      default: false,
    },
    imgWidth: {
      default: '100%',
    },
    mintNum: {
      default: '0',
    },
    collectionName: {
      default: 'CandyLand',
    },
    immutableName: {
      default: 'Alcorex',
    },
  },
  data() {
    return {
      currentDate: new Date(),
    }
  },
}
</script>
<style lang="scss" scoped>
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
