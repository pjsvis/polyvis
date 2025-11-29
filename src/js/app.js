import Alpine from 'alpinejs'
import navigation from './components/nav.js'
import explorerApp from './components/explorer.js'
import sigmaApp from './components/sigma-explorer.js'
import graphApp from './components/graph.js'
import docViewer from './components/doc-viewer.js'

window.Alpine = Alpine

Alpine.data('navigation', navigation)
Alpine.data('explorerApp', explorerApp)
Alpine.data('sigmaApp', sigmaApp)
Alpine.data('graphApp', graphApp)
Alpine.data('docViewer', docViewer)

Alpine.start()
