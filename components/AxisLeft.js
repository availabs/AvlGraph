import React from "react"

import { AxisBase } from "./ComponentBase"

import d3 from "./d3"

export class AxisLeft extends AxisBase {
  updateAxis(oldDomain = []) {
    const {
      id,
      yDomain,
      width,
      height,
      margin: { top, right, bottom, left },
      label,
      showGridLines
    } = this.props;

    const adjustedWidth = Math.max(0, width - left - right),
      adjustedHeight = Math.max(0, height - top - bottom);

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([adjustedHeight, 0]);

    const oldScale = d3.scaleLinear()
      .domain(oldDomain)
      .range([adjustedHeight, 0])

    const axisLeft = d3.axisLeft(yScale);

    const transition = d3.transition().duration(1000);

    const reactGroup = d3.select(this.group.current)
      .style("transform", `translate(${ left }px, ${ top }px)`)
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
      .data(yDomain.length ? ["axis-left"] : [])
      .join("g")
        .attr("class", "axis axis-left")
          .transition(transition)
          .call(axisLeft);

    group.selectAll("g.axis path.domain")
      .attr("stroke-width", 2)

    group.selectAll("text.axis-label")
      .data(yDomain.length && Boolean(label) ? [label] : [])
      .join("text")
        .attr("class", "axis-label axis-label-left")
        .style("transform", `translate(${ -left + 11 }px, ${ adjustedHeight * 0.5 }px) rotate(-90deg)`)
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
        .attr("x2", adjustedWidth)
        .attr("y1", oldDomain.length ? yScale(yDomain[1] * 1.5) : yScale)
        .attr("y2", oldDomain.length ? yScale(yDomain[1] * 1.5) : yScale)
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.25)
        .merge(gridLines)
          .transition(transition)
            .attr("y1", yScale)
            .attr("y2", yScale)
    if (yDomain.length) {
      gridLines.exit()
        .transition(transition)
          .attr("y1", yScale(yDomain[1] * 1.5))
          .attr("y2", yScale(yDomain[1] * 1.5))
        .remove()
    }
  }
}
