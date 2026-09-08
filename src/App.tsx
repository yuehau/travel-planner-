import { Header } from './components/Header'
import { NodeDrawer } from './components/NodeDrawer'
import { TripCanvas } from './components/TripCanvas'

export default function App() {
  return (
    <div className="flex h-screen w-screen flex-col">
      <Header />
      <div className="min-h-0 flex-1 bg-gray-50">
        <TripCanvas />
      </div>
      <NodeDrawer />
    </div>
  )
}
