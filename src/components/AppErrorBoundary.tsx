import { Component, ErrorInfo, ReactNode } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { logError } from '../utils/log'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError('boundary', `render crash: ${error.message}`, info.componentStack)
  }

  handleReset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: '#f5f5f0' },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  message: { fontSize: 13, color: '#666', textAlign: 'center' },
  button: { marginTop: 8, backgroundColor: '#1a5f3f', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
