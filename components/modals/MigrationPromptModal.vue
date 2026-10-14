<template lang="pug">
//- Предлагает открыть ту же страницу в новом Alcor. Дверь не закрывает: «Остаться»
//- оставляет человека здесь на SNOOZE_DAYS и спрашивает, что его держит. Ответы
//- приходят в OpenPanel (`migration_reason_submitted`), по ним доделываем новый.
//- Без крестика и Esc: выход только через один из двух ответов.
ElDialog.migration-prompt(
  :visible='visible',
  :title='step === "offer" ? "Alcor has moved" : "What keeps you here?"',
  :show-close='false',
  :close-on-click-modal='false',
  :close-on-press-escape='false',
  append-to-body,
  width='440px'
)
  .prompt(v-if='step === "offer"')
    p.lead
      | This page is already on the new Alcor. Your wallet, balances, orders and
      | positions are all there — they live on-chain, nothing to move.

    .actions
      AlcorButton(tag='a', :href='targetUrl', access, @click='accept') Open this page on new Alcor
      AlcorButton(transparent, @click='stay') Stay on the old version

  .prompt(v-else)
    p.lead
      | You can keep using this version either way. One tap helps us fix what the
      | new one is missing.

    .reasons
      .reason(
        v-for='item in reasons',
        :key='item.key',
        :class='{ active: reason === item.key }',
        @click='reason = item.key'
      )
        i(:class='reason === item.key ? "el-icon-success" : "el-icon-circle-check"')
        span {{ item.label }}

    ElInput(
      v-if='reason',
      v-model='details',
      type='textarea',
      :rows='2',
      :maxlength='DETAILS_MAX',
      :placeholder='detailsPlaceholder'
    )

    .actions
      AlcorButton(access, :disabled='!reason', @click='submit') Send
      AlcorButton(transparent, @click='close') Skip
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import { op } from '~/plugins/openpanel'
import { VENUES, cleanPath, counterpartPath, newAlcorTrackedUrl } from '~/utils/newAlcorRoutes'

const STAYED_STORAGE_KEY = 'alcor_migration_prompt_stayed_at'
const SNOOZE_DAYS = 14
const DETAILS_MAX = 300

// `key` уходит в OpenPanel как `reason`: не переименовывать, иначе история разъедется.
const REASONS = [
  { key: 'habit', label: "I'm used to this one", placeholder: 'Anything else? (optional)' },
  { key: 'missing_feature', label: 'Something I need is missing there', placeholder: 'What exactly?' },
  { key: 'wallet', label: "My wallet doesn't work there", placeholder: 'Which wallet, and what goes wrong?' },
  { key: 'ux', label: 'The new one is harder to use or slower', placeholder: 'What gets in the way?' },
  { key: 'language', label: "It doesn't have my language", placeholder: 'Which language?' },
  { key: 'other', label: 'Something else', placeholder: 'Tell us' },
]

function stayedRecently() {
  const stayedAt = parseInt(localStorage.getItem(STAYED_STORAGE_KEY))
  if (!stayedAt) return false

  const daysPassed = (Date.now() - stayedAt) / (1000 * 60 * 60 * 24)
  return daysPassed < SNOOZE_DAYS
}

export default {
  name: 'MigrationPromptModal',
  components: { AlcorButton },

  data() {
    return {
      visible: false,
      shown: false,
      step: 'offer',
      reason: null,
      details: '',
      reasons: REASONS,
      DETAILS_MAX,
    }
  },

  computed: {
    page() {
      return cleanPath(this.$route.path)
    },

    /** Путь той же страницы в новом Alcor, или null — аналога нет, не предлагаем. */
    targetPath() {
      const venue = VENUES[this.$store.state.network.name]
      if (!venue) return null

      const { searchParams } = new URL(this.$route.fullPath, 'http://localhost')
      return counterpartPath(venue, this.page, searchParams)
    },

    targetUrl() {
      return this.targetPath && newAlcorTrackedUrl(this.targetPath, 'prompt')
    },

    detailsPlaceholder() {
      return REASONS.find(({ key }) => key === this.reason)?.placeholder
    },
  },

  watch: {
    // Первая страница может быть без аналога (NFT, аккаунт): тогда предложим на
    // следующей, где он есть. Один раз за загрузку.
    targetPath() {
      this.tryShow()
    },
  },

  mounted() {
    this.tryShow()
  },

  methods: {
    tryShow() {
      if (this.shown || !this.targetPath) return
      // Старый UI встраивают на чужие сайты в iframe: там не мешаем.
      if (window.self !== window.top) return
      if (stayedRecently()) return

      this.shown = true
      this.visible = true
      op.track('migration_prompt_shown', { page: this.page, target: this.targetPath })
    },

    accept() {
      op.track('migration_prompt_accepted', { page: this.page, target: this.targetPath })
    },

    stay() {
      localStorage.setItem(STAYED_STORAGE_KEY, Date.now().toString())
      op.track('migration_prompt_dismissed', { page: this.page, target: this.targetPath })
      this.step = 'reason'
    },

    submit() {
      op.track('migration_reason_submitted', {
        page: this.page,
        reason: this.reason,
        details: this.details.trim().slice(0, DETAILS_MAX) || undefined,
      })
      this.close()
      this.$notify({ type: 'success', title: 'Thank you', message: 'We read every answer.' })
    },

    close() {
      this.visible = false
    },
  },
}
</script>

<style lang="scss" scoped>
.migration-prompt ::v-deep .el-dialog {
  max-width: calc(100vw - 32px);
  border-radius: 16px;
}

.prompt {
  display: flex;
  flex-direction: column;
  gap: 16px;
  word-break: normal;
}

.lead {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-default);
}

.reasons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reason {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-default);
  cursor: pointer;
  transition: border-color 0.2s;

  i {
    color: var(--text-disable);
  }

  &:hover,
  &.active {
    border-color: var(--main-green);
  }

  &.active i {
    color: var(--main-green);
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .alcor-button {
    width: 100%;
  }
}
</style>
