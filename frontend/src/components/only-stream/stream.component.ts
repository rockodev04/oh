import { navigate } from '../../core/router.core'

class OnlyStream extends HTMLElement {
  private ws: WebSocket | null = null
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private streamId: string = ''

  async connectedCallback() {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    this.innerHTML = `
      <only-navbar></only-navbar>
      <main class="container fade-in" style="padding-top:32px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
          <h2>Streaming</h2>
          <button id="new-stream-btn" class="btn btn-primary btn-sm">+ Nueva transmisión</button>
        </div>

        <div id="stream-alert" class="alert" style="display:none;"></div>

        <div id="host-panel" style="display:none;" class="card fade-in" style="margin-bottom:24px;">
          <h3 style="margin-bottom:16px;">Tu transmisión</h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
            <video id="local-video" autoplay muted playsinline
              style="width:100%; border-radius:12px; background:#000; aspect-ratio:16/9;">
            </video>
            <div style="display:flex; flex-direction:column; gap:12px; justify-content:center;">
              <button id="share-camera-btn" class="btn btn-primary">📷 Compartir cámara</button>
              <button id="share-screen-btn" class="btn btn-secondary">🖥️ Compartir pantalla</button>
              <button id="stop-stream-btn" class="btn btn-danger" style="display:none;">⏹ Detener transmisión</button>
            </div>
          </div>
          <div id="stream-status" style="font-size:0.8rem; color:var(--text-muted);"></div>
        </div>

        <div id="active-streams">
          <div class="skeleton-card">
            <div class="skeleton skeleton-title" style="width:30%"></div>
            <div class="skeleton skeleton-text" style="width:50%"></div>
            <div class="skeleton" style="height:200px; border-radius:12px; margin-top:16px;"></div>
          </div>
          <div class="skeleton-card">
            <div class="skeleton skeleton-title" style="width:40%"></div>
            <div class="skeleton skeleton-text" style="width:60%"></div>
            <div class="skeleton" style="height:200px; border-radius:12px; margin-top:16px;"></div>
          </div>
        </div>
      </main>
    `

    await this.loadStreams(token)

    this.querySelector('#new-stream-btn')?.addEventListener('click', () => {
      this.showNewStreamForm(token)
    })
  }

  async loadStreams(token: string) {
    const container = this.querySelector('#active-streams')!
    try {
      const res = await fetch('http://localhost:3001/streams/active', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json() as { streams: any[] }

      if (!data.streams?.length) {
        container.innerHTML = `
          <div class="card" style="text-align:center; padding:48px;">
            <p style="font-size:2rem; margin-bottom:12px;">📡</p>
            <p>No hay transmisiones activas en este momento.</p>
          </div>`
        return
      }

      container.innerHTML = data.streams.map((s: any) => `
        <div class="card fade-in" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
              <span class="stream-live">EN VIVO</span>
              <h3 style="margin-top:8px;">${s.title}</h3>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
                Membresía requerida: <span class="membership-${s.membership_required}">${s.membership_required}</span>
              </p>
            </div>
            <button class="btn btn-primary btn-sm join-btn" data-id="${s.id}">Unirse</button>
          </div>
          <video id="remote-video-${s.id}" autoplay playsinline
            style="width:100%; border-radius:12px; background:#000; aspect-ratio:16/9; display:none;">
          </video>
          <div id="viewer-status-${s.id}" style="display:none; padding:16px; text-align:center; color:var(--text-muted); font-size:0.875rem;">
            Conectando...
          </div>
        </div>
      `).join('')

      this.querySelectorAll('.join-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt((btn as HTMLElement).dataset.id ?? '0')
          const res = await fetch(`http://localhost:3001/streams/${id}/join`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            this.joinStreamAsViewer(id.toString())
            const video = this.querySelector(`#remote-video-${id}`) as HTMLElement
            const status = this.querySelector(`#viewer-status-${id}`) as HTMLElement
            video.style.display = 'block'
            status.style.display = 'block'
          } else {
            const data = await res.json() as { error: string }
            alert(data.error ?? 'No tienes acceso a esta transmisión')
          }
        })
      })

    } catch {
      container.innerHTML = `<div class="alert alert-error">Error al cargar transmisiones</div>`
    }
  }

  showNewStreamForm(token: string) {
    const container = this.querySelector('#active-streams')!
    const existing = this.querySelector('#new-stream-form')
    if (existing) { existing.remove(); return }

    const form = document.createElement('div')
    form.id = 'new-stream-form'
    form.className = 'card fade-in'
    form.style.marginBottom = '16px'
    form.innerHTML = `
      <h3 style="margin-bottom:16px;">Nueva transmisión</h3>
      <div class="form-group">
        <label class="form-label">Título</label>
        <input class="form-input" id="stream-title" placeholder="Convención de hacking 2025" />
      </div>
      <div class="form-group">
        <label class="form-label">Membresía requerida</label>
        <select class="form-input" id="stream-membership">
          <option value="none">Pública</option>
          <option value="gameboy">Gameboy</option>
          <option value="playboy">Playboy</option>
        </select>
      </div>
      <div style="display:flex; gap:12px;">
        <button id="start-stream-btn" class="btn btn-primary">Iniciar transmisión</button>
        <button id="cancel-stream-btn" class="btn btn-secondary">Cancelar</button>
      </div>
    `
    container.prepend(form)

    form.querySelector('#cancel-stream-btn')?.addEventListener('click', () => form.remove())
    form.querySelector('#start-stream-btn')?.addEventListener('click', async () => {
      const title = (form.querySelector('#stream-title') as HTMLInputElement).value
      const membership = (form.querySelector('#stream-membership') as HTMLSelectElement).value as "none" | "gameboy" | "playboy"

      const res = await fetch('http://localhost:3001/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, membership_required: membership })
      })

      if (res.ok) {
        const stream = await res.json() as { id: number }
        this.streamId = stream.id.toString()
        form.remove()
        this.startAsHost(token)
      }
    })
  }

  startAsHost(token: string) {
    const hostPanel = this.querySelector('#host-panel') as HTMLElement
    hostPanel.style.display = 'block'
    this.connectSignaling(this.streamId, 'host')

    this.querySelector('#share-camera-btn')?.addEventListener('click', async () => {
      await this.startLocalStream('camera')
    })
    this.querySelector('#share-screen-btn')?.addEventListener('click', async () => {
      await this.startLocalStream('screen')
    })
    this.querySelector('#stop-stream-btn')?.addEventListener('click', async () => {
      this.stopStream(token)
    })
  }

  async startLocalStream(type: 'camera' | 'screen') {
    try {
      if (this.localStream) this.localStream.getTracks().forEach(t => t.stop())

      if (type === 'camera') {
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      } else {
        this.localStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true })
      }

      const localVideo = this.querySelector('#local-video') as HTMLVideoElement
      localVideo.srcObject = this.localStream

      const stopBtn = this.querySelector('#stop-stream-btn') as HTMLElement
      stopBtn.style.display = 'block'

      const status = this.querySelector('#stream-status') as HTMLElement
      status.textContent = type === 'camera' ? '📷 Transmitiendo desde cámara' : '🖥️ Compartiendo pantalla'

      this.broadcastStream()
    } catch {
      alert('No se pudo acceder al dispositivo. Verifica los permisos.')
    }
  }

  connectSignaling(streamId: string, role: 'host' | 'viewer') {
    this.ws = new WebSocket('ws://localhost:3002')
    const userId = localStorage.getItem('userId') ?? '0'

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({ type: 'join', streamId, userId, role }))
    }

    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data)
      if (role === 'host') {
        if (data.type === 'user-joined') await this.createOffer(data.userId)
        if (data.type === 'answer') await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.sdp))
      }
      if (role === 'viewer') {
        if (data.type === 'offer') await this.handleOffer(data.sdp, streamId)
        if (data.type === 'answer') await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.sdp))
      }
      if (data.type === 'ice-candidate' && data.candidate) {
        await this.peerConnection?.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    }
  }

  broadcastStream() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    this.localStream?.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!)
    })
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws?.send(JSON.stringify({ type: 'ice-candidate', streamId: this.streamId, candidate: event.candidate }))
      }
    }
  }

  async createOffer(targetUserId: string) {
    if (!this.peerConnection) return
    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    this.ws?.send(JSON.stringify({ type: 'offer', streamId: this.streamId, sdp: offer, targetUserId }))
  }

  joinStreamAsViewer(streamId: string) {
    this.streamId = streamId
    this.connectSignaling(streamId, 'viewer')
  }

  async handleOffer(sdp: RTCSessionDescriptionInit, streamId: string) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    this.peerConnection.ontrack = (event) => {
      const remoteVideo = this.querySelector(`#remote-video-${streamId}`) as HTMLVideoElement
      const status = this.querySelector(`#viewer-status-${streamId}`) as HTMLElement
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0]
        if (status) status.style.display = 'none'
      }
    }

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws?.send(JSON.stringify({ type: 'ice-candidate', streamId, candidate: event.candidate }))
      }
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    this.ws?.send(JSON.stringify({ type: 'answer', streamId, sdp: answer }))
  }

  async stopStream(token: string) {
    this.localStream?.getTracks().forEach(t => t.stop())
    this.peerConnection?.close()
    this.ws?.close()

    await fetch(`http://localhost:3001/streams/${this.streamId}/end`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const hostPanel = this.querySelector('#host-panel') as HTMLElement
    hostPanel.style.display = 'none'
    await this.loadStreams(token)
  }

  disconnectedCallback() {
    this.localStream?.getTracks().forEach(t => t.stop())
    this.peerConnection?.close()
    this.ws?.close()
  }
}

if (!customElements.get('only-stream')) {
  customElements.define('only-stream', OnlyStream)
}