<template>
  <va-alert
      v-model="isAlertVisible"
      class="sys-alert"
      closeable
      description="Welcome to BSSD OCR Demo System. Only demo usage, the system was setup to slow down process as intend. Please don't use for any commercial purposes."
  />
  <va-navbar
      class="navbar-w">
    <template #left>
      <div class="navbar-left">
        <va-badge
            overlap
            text="Demo"
        >
          <NuxtLink class="menu-logo" to="/" @click="updateMenuStyle">
            <va-navbar-item class="logo">
              BSSD 🚀 OCR
            </va-navbar-item>
          </NuxtLink>
        </va-badge>
      </div>
    </template>
    <va-navbar-item v-for="(item, index) in menu" :key="index" @click="updateMenuStyle(item)">
      <NuxtLink :class="item.class" :to="item.link">{{ item.name }}</NuxtLink>
    </va-navbar-item>
  </va-navbar>
  <div class="main-content">
    <slot/>
  </div>
</template>

<script setup>
import {useMenuStore} from "~/store/global";

const store = useMenuStore()
const menu = computed(() => store.menuData)

const updateMenuStyle = (item) => {
  store.calculateMenuStyle(item.link)
}
const url = useRequestURL()
updateMenuStyle(url.pathname)

const isAlertVisible = ref(true)
</script>

<style lang="scss" scoped>
.logo {
  font-weight: 600;
  font-size: 1.5rem;
  color: var(--va-info);
}

.logo-img {
  margin-bottom: 0
}

.sys-alert {
  --va-alert-margin-y: 0;
  --va-alert-border-radius: 0;
}

.navbar-w {
  min-width: auto;
  width: auto;
}

@media only screen and (max-width: 767.98px) {
  .navbar-left {
    margin-bottom: 0.5rem;
  }
}

</style>
