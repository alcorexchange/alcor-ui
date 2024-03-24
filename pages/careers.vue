<template lang="pug">
div.careers-page
  h1.mt-4 Our Careers
  p.muted Work in one of the most promising projects in the DEX field. Remote work, an open source project, a team of interesting people around the world. If you like blockchain technology, write to us.
  .careers
    .career-item(v-for="item in careers")
      .career-item-header
        .name {{ item.title }}
        .type.fs-14(v-if="item.type") {{ item.type }}
      .career-item-content
        .location.fs-14
          i.el-icon-location-outline
          span {{ item.location }}
        p.description.muted {{ item.description }}
      .career-item-action
        AlcorButton(access) Apply
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  components: {
    AlcorButton,
  },
  computed: {
    careers() {
      return [
        {
          title: 'BlockChain Developer',
          location: 'Remote',
          type: 'Part Time',
          description:
            'This is the job description This is the job description This is the job description This is the job description.',
        },
        {
          title: 'BlockChain Developer',
          location: 'Remote',
          type: 'Part Time',
          description:
            'This is the job description This is the job description This is the job description This is the job description.',
        },
      ]
    },
  },
}
</script>

<style scoped lang="scss">
.careers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  margin-top: 20px;
  gap: 20px;
  .career-item {
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 0 1px var(--border-color);
    background: var(--background-color-third);
    padding: 18px;
    border-radius: 10px;
    &-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      .name {
        font-weight: bold;
        font-size: 18px;
      }
      .type {
        color: var(--main-green);
      }
    }
    .location {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      color: var(--text-disable);
    }

    &-action {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
    }
  }
}
</style>
