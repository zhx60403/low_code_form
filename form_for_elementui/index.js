export default {
  install(Vue) {
    const modulesFiles = require.context('./', false, /\.vue$/)
    modulesFiles.keys().forEach(modulePath => {
      const moduleName = modulePath.replace(/^\.\/(.*)\.\w+$/, '$1')
      const value = modulesFiles(modulePath)
      Vue.component(moduleName, value.default)
    })
  }
}
