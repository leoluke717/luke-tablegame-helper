import { createServer } from 'vite'
import fs from 'fs'
import path from 'path'

export default function createViteServer() {
  const middlewares = []

  middlewares.push((req, res, next) => {
    // 处理SPA路由
    if (!req.url.startsWith('/@') &&
        !req.url.startsWith('/src') &&
        !req.url.includes('.') &&
        req.method === 'GET') {
      const htmlPath = path.resolve(process.cwd(), 'index.html')
      if (fs.existsSync(htmlPath)) {
        res.setHeader('Content-Type', 'text/html')
        const html = fs.readFileSync(htmlPath, 'utf-8')
        res.end(html)
        return
      }
    }
    next()
  })

  return middlewares
}
