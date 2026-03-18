<template>
  <article class="panel">
    <h3>南昌市降水地图</h3>
    <div class="map">
      <div class="dot" />
    </div>
    <p class="note">至少 2 小时内没有降水。</p>
  </article>
</template>

<style scoped>
.panel {
  padding: 20px;
  border-radius: 16px;
  background: #213a6a;
}

h3 {
  margin-bottom: 12px;
}

.map {
  height: 220px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 55% 52%, #ffd35a 0 7px, transparent 8px),
    linear-gradient(135deg, #a6d3ec 0%, #d9efff 35%, #cae8f3 100%);
  position: relative;
  overflow: hidden;
}

.map::before,
.map::after {
  content: '';
  position: absolute;
  width: 180%;
  height: 2px;
  background: rgba(60, 107, 130, 0.25);
  left: -40%;
}

.map::before {
  top: 40%;
  transform: rotate(-9deg);
}

.map::after {
  top: 62%;
  transform: rotate(6deg);
}

.note {
  margin-top: 12px;
  color: #c7d6ff;
}
</style>
