<template>
  <client-only placeholder="Loading...">
    <div class="frame">
      <css-doodle>
        <!-- <style>
          @grid: 14x1 / 600px;
          @place-cell: center;
          @size: 100%;
          animation: m @r(3s, 10s) -@r(10s) linear infinite;
          @keyframes m {
            to { transform: rotate(1turn) }
          }
          background: @svg(
            <svg viewBox="0 0 100 100">
              <defs>
                <linearGradient id="e">
                  <stop stop-color="#CCCFCF" offset="0" />
                  <stop stop-color="rgba(0, 0, 0, 0)" offset="1" />
                </linearGradient>
              </defs>
              <circle
                cx="50" cy="50"
                r="@calc(10 + 30 / @I * @i)"
                fill="none"
                stroke="url(#e)"
                stroke-width=".7"
                stroke-dashoffset="0"
                stroke-linecap="round"
                stroke-dasharray="@calc(30 + 30 / @I * @i * 3)"
              />
            </svg>
          );
          @even {
            animation-direction: reverse;
            background: @svg(
            <svg viewBox="0 0 100 100">
              <defs>
                <linearGradient id="e">
                  <stop stop-color="rgba(255, 255, 255, 0)" offset="0" />
                  <stop stop-color="#82E792" offset="1" />
                </linearGradient>
              </defs>
              <circle
                cx="50" cy="50"
                r="@calc(10 + 30 / @I * @i)"
                fill="none"
                stroke="url(#e)"
                stroke-width=".7"
                stroke-dashoffset="0"
                stroke-linecap="round"
                stroke-dasharray="@calc(30 + 30 / @I * @i * 3)"
              />
            </svg>
          );
          }
        </style> -->
      </css-doodle>
    </div>
  </client-only>
</template>

<style lang="scss">
//body {
//  background: #262626;
//  display: grid;
//  place-items: center;
//  margin: 0;
//}
//
//html, body {
//  height: 100%;
//}
</style>
