import { registerRootComponent } from 'expo'
import App from './App'
import { log } from './src/utils/log'

log('index', 'bundle evaluated, registering root component')

// registerRootComponent MUST be called synchronously during bundle evaluation.
// On Android release builds the native side calls
// AppRegistry.runApplication('main') immediately after the bundle is
// evaluated — if registration is deferred behind any await (as a previous
// version of this file did for RTL bootstrapping), 'main' is not yet
// registered at that moment and the app hangs on a black screen with no JS
// error. RTL/language sync now lives in I18nProvider, which runs after mount
// and reloads the app once if the layout direction needs to flip.
registerRootComponent(App)

log('index', 'root component registered')
