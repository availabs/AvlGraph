import React from "react"

export const generateDomains = (props, state) => {
  let xDomain = [],
    childDomains = [],
    yDomain = [];

  React.Children.forEach(props.children, child => {
    const { data, getDomainX, getDomainY, keys } = child.props,
      xd = getDomainX(data),
      yd = getDomainY(data, keys);
    if (xd !== null) {
      childDomains.push(xd);
    }
    if (yd !== null) {
      const [y0, y1] = yd;
      yDomain = [0, Math.max(y1, (yDomain[1] || -Infinity))];
    }
  })
  xDomain = childDomains.reduce((a, c) => {
    return a.length > c.length ? a : a.length < c.length ? c : a;
  }, []);

  return { xDomain, yDomain };
}
