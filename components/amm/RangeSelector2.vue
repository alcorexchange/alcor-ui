<template lang="pug">
.div
  el-button(primary @click="init") Update
  svg#chart.chart
</template>

<script>
import * as d3 from 'd3'

export default {
  methods: {
    init() {
      const data = [
        {
          key: 1,
          value: 37
        },
        {
          key: 1.5,
          value: 13
        },
        {
          key: 2.5,
          value: 1
        },
        {
          key: 3,
          value: 4
        },
        {
          key: 3.5,
          value: 14
        },
        {
          key: 4,
          value: 18
        },
        {
          key: 4.5,
          value: 21
        },
        {
          key: 5,
          value: 17
        },
        {
          key: 5.5,
          value: 16
        },
        {
          key: 6,
          value: 5
        },
        {
          key: 6.5,
          value: 4
        }
      ]

      // svg sizes
      const width = 400,
        height = 200

      const m = 50
      const margin = {
        top: m,
        right: m,
        bottom: m,
        left: m
      }

      const y = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.value))
        .range([height - margin.bottom, margin.top])

      const x = d3
        .scaleLinear()
        .domain(
          d3.extent(data, (d) => d.key).map((v, i) => (i == 0 ? v - 1 : v + 1))
        )
        .rangeRound([margin.left, width - margin.right])

      const svg = d3
        .select('.chart#chart')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)

      const rects = svg.append('g').attr('class', 'rects')
      const clips = svg.append('g').attr('class', 'clips')

      svg
        .append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))

      svg
        .append('g')
        .attr('class', 'y-axis')
        .style('display', 'none')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))

      svg
        .append('defs')
        .append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', width - margin.right)
        .attr('height', height - margin.bottom)

      const brush = d3
        .brushX()
        .extent([
          [x.range()[0], margin.top],
          [x.range()[1], height - margin.bottom]
        ])
        .on('brush', brushed)
        .on('start', brushed)
        .on('end', brushend)

      function brushend(e) {
        if (!e.selection || !e.selection.length) {
          svg
            .select('#clip>rect')
            .attr('x', margin.left)
            .attr('width', width - margin.right)
        }
      }

      function brushed(e) {
        svg
          .select('#clip>rect')
          .attr('x', e.selection[0])
          .attr('width', e.selection[1] - e.selection[0])

        const selected = {
          x0: x.invert(e.selection[0]),
          x1: x.invert(e.selection[1])
        }
      }

      rects
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.key))
        .attr('y', (d) => y(d.value))
        .attr('height', (d) => height - y(d.value) - margin.bottom)
        .attr('width', 20)
        .style('stroke', 'white')
        .style('fill', 'gray')
        .append('title')
        .text((d) => d.key)

      clips
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('clip-path', 'url(#clip)')
        .attr('x', (d) => x(d.key))
        .attr('y', (d) => y(d.value))
        .attr('height', (d) => height - y(d.value) - margin.bottom)
        .attr('width', 20)
        .style('stroke', 'white')
        .append('title')
        .text((d) => d.key)

      svg
        .append('g')
        .attr('class', 'x brush')
        .call(brush) // initialize the brush
        .selectAll('rect')
        .attr('y', 0)
        .attr('height', height)
    }
  },
  mounted() {
    this.init()
  }
}
</script>
