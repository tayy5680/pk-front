<template>
  <div class="error-msg">{{ $t('帳號已停用') }}</div>
</template>

<script setup></script>
<style lang="scss" scoped>
  .error-msg {
    color: white;
    display: flex;
    inset: 0;
    position: fixed;
    justify-content: center;
    align-items: center;
  }
</style>
