import React from "react"

import { AxisBase } from "./ComponentBase"

import d3 from "./d3"

export class AxisBottom extends AxisBase {
  updateAxis(oldDomain = []) {
    const {
      xDomain,
      width,
      height,
      margin: { top, right, bottom, left },
      xFormat,
      label,
      padding,
      secondary
    } = this.props;

    const adjustedWidth = Math.max(0, width - left - right),
      adjustedHeight = Math.max(0, height - top - bottom);

    const xScale = d3.scalePoint()
      .domain(xDomain)
      .range([0, adjustedWidth])
      .padding(padding);

    const axisBottom = d3.axisBottom(xScale)
      .tickValues(this.getTickValues())
      .tickFormat(xFormat);

    const transition = d3.transition().duration(1000);

    const reactGroup = d3.select(this.group.current)
      .style("transform", `translate(${ left }px, ${ height - bottom }px)`);

    const group = reactGroup.selectAll("g.axis-group")
      .data(xDomain.length ? ["axis-group"] : [])
      .join(
        enter => enter.append("g")
          .attr("class", "axis-group")
          .call(enter =>
            enter.style("transform", `scale(0, 0)`)
              .transition(transition)
                .style("transform", "scale(1, 1)")
          ),
        update => update,
        exit => exit
          .call(exit =>
            exit.transition(transition)
              .style("transform", `scale(0, 0)`)
            .remove()
          )
      )

    // const group = reactGroup.selectAll("g.axis-group")
    //   .data(xDomain.length ? ["axis-group"] : [])
    //   .join(
    //     enter => enter.append("g")
    //       .attr("class", "axis-group")
    //       .call(enter =>
    //         enter.style("transform", `translateX(${ adjustedWidth * 0.5 }px) scale(0, 1)`)
    //           .transition(transition)
    //             .style("transform", "translateX(0px) scale(1, 1)")
    //       ),
    //     update => update,
    //     exit => exit
    //       .call(exit =>
    //         exit.transition(transition)
    //           .style("transform", `translateX(${ adjustedWidth * 0.5 }px) scale(0, 1)`)
    //         .remove()
    //       )
    //   )

    // const group = reactGroup.selectAll("g.axis-group")
    //   .data(xDomain.length ? ["axis-group"] : [])
    //   .join(
    //     enter => enter.append("g")
    //       .attr("class", "axis-group")
    //       .call(enter =>
    //         enter.style("transform", `translateX(${ adjustedWidth * 0.5 }px) scale(0, 0)`)
    //           .transition(transition)
    //             .style("transform", "translateX(0px) scale(1, 1)")
    //       ),
    //     update => update,
    //     exit => exit
    //       .call(exit =>
    //         exit.transition(transition)
    //           .style("transform", `translateX(${ adjustedWidth * 0.5 }px) scale(0, 0)`)
    //         .remove()
    //       )
    //   )

    group.selectAll("g.axis")
      .data(xDomain.length ? ["axis-bottom"] : [])
        .join("g")
          .attr("class", "axis axis-bottom")
          .classed("secondary", secondary)
          .transition().duration(1000)
          .call(axisBottom);

    group.selectAll("text.axis-label")
      .data(xDomain.length && Boolean(label) ? [label] : [])
        .join("text")
          .attr("class", "axis-label axis-label-bottom")
          .style("transform", `translate(${ adjustedWidth * 0.5 }px, ${ bottom - 5 }px)`)
          .attr("text-anchor", "middle")
					.attr("fill", "#000")
          .attr("font-size", "1rem")
          .text(d => d)
  }
  getTickValues() {
    let {
      xDomain,
      ticks,
      tickValues
    } = this.props;

    if (tickValues.length) return tickValues;

    return [
      ...new Set(
        d3.scaleLinear()
          .domain([xDomain.length > 10 ? 1 : 0, xDomain.length - 1])
          .ticks(ticks)
          .map(t => Math.round(t))
      )
    ]
    .map(t => xDomain[t]);
  }
}
