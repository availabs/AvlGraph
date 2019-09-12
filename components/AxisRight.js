import React from "react"

import { AxisBase } from "./ComponentBase"

import d3 from "./d3"

export class AxisRight extends AxisBase {
  updateAxis(oldDomain = []) {
    const {
      id,
      yDomain,
      width,
      height,
      margin: { top, right, bottom, left },
      label,
      showGridLines,
      secondary
    } = this.props;

    const adjustedWidth = Math.max(0, width - left - right),
      adjustedHeight = Math.max(0, height - top - bottom);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([adjustedHeight, 0]);

console.log(yDomain, yScale.ticks(10).map(t => yScale(t)))

    const oldScale = d3.scaleLinear()
      .domain(oldDomain)
      .range([adjustedHeight, 0])

    const axisRight = d3.axisRight(yScale);

    const transition = d3.transition().duration(1000);

    const reactGroup = d3.select(this.group.current)
      .style("transform", `translate(${ width - right }px, ${ top }px)`)
      .style("pointer-events", "none");

    const group = reactGroup.selectAll("g.axis-group")
      .data(yDomain.length ? ["axis-group"] : [])
        .join(
          enter => enter.append("g")
            .attr("class", "axis-group")
            .call(enter =>
              enter
                .style("transform", `translateY(${ adjustedHeight }px) scale(0, 0)`)
                .transition(transition)
                  .style("transform", "translateY(0px) scale(1, 1)")
            ),
          update => update,
          exit => exit
            .call(exit =>
              exit.transition(transition)
                .style("transform", `translateY(${ adjustedHeight }px) scale(0, 0)`)
              .remove()
            )
        )

    group.selectAll("g.axis")
      .data(yDomain.length ? ["axis-right"] : [])
      .join("g")
        .attr("class", "axis axis-right")
          .classed("secondary", secondary)
          .transition(transition)
          .call(axisRight);

    group.selectAll("text.axis-label")
      .data(yDomain.length && Boolean(label) ? [label] : [])
      .join("text")
        .attr("class", "axis-label axis-label-right")
        .style("transform", `translate(${ right - 11 }px, ${ adjustedHeight * 0.5 }px) rotate(90deg)`)
        .attr("text-anchor", "middle")
				.attr("fill", "#000")
        .attr("font-size", "1rem")
        .text(d => d);

    const gridLines = group.selectAll("line.grid-line")
      .data(yDomain.length && showGridLines ? yScale.ticks(10) : []);
    gridLines.enter()
      .append("line")
        .attr("class", "grid-line")
        .attr("x1", 0)
        .attr("x2", -adjustedWidth)
        .attr("y1", oldDomain.length ? yScale(yDomain[1] * 1.5) : d => yScale(d) + 0.5)
        .attr("y2", oldDomain.length ? yScale(yDomain[1] * 1.5) : d => yScale(d) + 0.5)
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.25)
        .merge(gridLines)
          .transition(transition)
            .attr("y1", d => yScale(d) + 0.5)
            .attr("y2", d => yScale(d) + 0.5)
    if (yDomain.length) {
      gridLines.exit()
        .transition(transition)
          .attr("y1", yScale(yDomain[1] * 1.5))
          .attr("y2", yScale(yDomain[1] * 1.5))
        .remove()
    }
  }
}
