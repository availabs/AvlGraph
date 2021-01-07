import React from "react"

import deepequal from "deep-equal"

export default (WrappedComponent, dataKey = "x") => {

  return class DataManager extends React.Component {
    static defaultProps = {
      ...WrappedComponent.defaultProps,
      dataKey
    }
    static getDerivedStateFromProps(props, state) {
      const { data, dataKey } = props;

      const exiting = { ...state.entering, ...state.updating, ...state.exiting },
        entering = {},
        updating = {};

      data.forEach(d => {
        const key = d[dataKey];
        if (state.entering[key]) {
          updating[key] = d;
        }
        else if (state.updating[key]) {
          updating[key] = d;
        }
        else {
          entering[key] = d;
        }
        delete exiting[key];
      })

      return { entering, exiting, updating };
    }
    state = {
      entering: {},
      updating: {},
      exiting: {}
    }
    MOUNTED = false
    componentDidMount() {
      this.MOUNTED = true;
    }
    componentWillUnmount() {
      this.MOUNTED = false;
    }
    setState(...args) {
      this.MOUNTED && super.setState(...args);
    }
    shouldComponentUpdate(nextProps, nextState) {
      return !deepequal(nextProps, this.props)
        || !deepequal(nextState, this.state);
    }
    componentDidUpdate() {
      const exitingKeys = Object.keys(this.state.exiting);
      if (exitingKeys.length) {
        setTimeout(() => this.exitData(exitingKeys), 1100);
      }
    }
    exitData(removeFromExiting) {
      this.setState((state, props) => {
        const exiting = { ...state.exiting };
        for (const key of removeFromExiting) {
          delete exiting[key];
        }
        return { exiting };
      });
    }
    render() {
// console.log("PROPS:", this.props)
      return <WrappedComponent { ...this.state } { ...this.props }/>
    }
  }
}
