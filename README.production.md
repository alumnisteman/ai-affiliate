# AI Affiliate OS — Instalasi Production

Paket ini menjalankan service production menggunakan Docker Compose:

- Nginx sebagai reverse proxy dan static web server
- API Node.js/Express
- PostgreSQL 16 dengan schema multi-tenant, product intelligence, affiliate tracking, AI content, analytics, dan WhatsApp automation
- Redis untuk cache/queue support
- RabbitMQ untuk worker queue
- Meilisearch untuk pencarian produk
- Certbot-ready untuk SSL Let's Encrypt

## 1. Persyaratan server

Gunakan server Ubuntu 22.04/24.04 dengan:

- Docker Engine dan Docker Compose Plugin
- DNS `A` record untuk `app.aiaffiliateos.com` dan `api.aiaffiliateos.com` ke IP server
- Port TCP 80 dan 443 terbuka

## 2. Instalasi awal

```bash
git clone <repository-url> ai-affiliate-os
cd ai-affiliate-os
cp .env.production.example .env.production
```

Edit `.env.production`, ganti semua `CHANGE_ME` dengan nilai acak yang panjang. Jangan commit file tersebut.

Validasi konfigurasi dan build API:

```bash
docker compose --env-file .env.production config
docker compose --env-file .env.production build api
```

Start seluruh service:

```bash
docker compose --env-file .env.production up -d
docker compose --env-file .env.production ps
```

Schema awal PostgreSQL otomatis dibuat saat volume database pertama kali dibuat. Seed plan `Free`, `Pro`, dan `Growth` juga dijalankan oleh PostgreSQL init script.

## 3. Verifikasi

```bash
curl http://127.0.0.1/api/healthz
curl http://127.0.0.1/nginx-health
docker compose --env-file .env.production logs --tail=100 api
```

Expected health API:

```json
{"status":"ok"}
```

## 4. SSL Let's Encrypt

Jalankan HTTP dulu agar ACME challenge dapat dilayani:

```bash
docker compose --env-file .env.production up -d postgres redis rabbitmq meilisearch api nginx
docker compose --env-file .env.production --profile ssl run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d app.aiaffiliateos.com -d api.aiaffiliateos.com \
  --email admin@aiaffiliateos.com --agree-tos --no-eff-email
```

Setelah sertifikat berhasil dibuat, aktifkan konfigurasi SSL:

```bash
docker compose -f docker-compose.yml -f docker-compose.ssl.yml \
  --env-file .env.production up -d nginx
```

Perpanjangan:

```bash
docker compose --env-file .env.production --profile ssl run --rm certbot renew
docker compose -f docker-compose.yml -f docker-compose.ssl.yml \
  --env-file .env.production exec nginx nginx -s reload
```

Konfigurasi SSL mengasumsikan sertifikat berada di path `app.aiaffiliateos.com`. Jika Certbot membuat folder berdasarkan nama domain berbeda, sesuaikan dua path sertifikat di `infra/nginx/conf.d/ssl.conf`.

## 5. Backup dan operasi

Backup database:

```bash
mkdir -p backups
docker compose --env-file .env.production exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
  > "backups/ai-affiliate-os-$(date +%Y%m%d-%H%M%S).dump"
```

Lihat status dan log:

```bash
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs -f api
docker compose --env-file .env.production logs -f nginx
```

Stop tanpa menghapus data:

```bash
docker compose --env-file .env.production down
```

Jangan gunakan `down -v` kecuali memang ingin menghapus seluruh data PostgreSQL, Redis, RabbitMQ, dan Meilisearch.

## Catatan keamanan

- PostgreSQL, Redis, RabbitMQ, dan Meilisearch hanya berada di network internal Compose dan tidak dipublish ke internet.
- Ubah password default sebelum start pertama.
- Gunakan firewall untuk membuka hanya port 22, 80, dan 443.
- Auth pengguna belum diaktifkan di API scaffold; integrasikan Clerk atau Replit Auth sebelum membuka dashboard ke publik.
- Setiap query fitur aplikasi harus menerapkan `tenant_id` dari konteks autentikasi. Schema menyediakan foreign key dan index tenant untuk fondasi ini.

## 6. Verifikasi Layanan

- **Periksa semua container yang sedang berjalan**:
```bash
docker compose --env-file .env.production ps
```
- **Cek health endpoint API** (gunakan domain atau IP sesuai konfigurasi SSL):
```bash
curl -k https://192.168.1.13/api/healthz
```
- **Cek health endpoint Nginx**:
```bash
curl -k http://192.168.1.13:8080/healthz
curl -k http://192.168.1.13/nginx-health
```
- **Pastikan respons** berupa JSON `{ "status": "ok" }` menandakan semua service berjalan lancar.

## 7. Monitoring & Logging

- **Log real‑time** untuk masing‑masing service:
```bash
docker compose --env-file .env.production logs -f api
docker compose --env-file .env.production logs -f nginx
docker compose --env-file .env.production logs -f postgres
```
- **Gunakan** tool monitoring seperti **Prometheus** dan **Grafana** (opsional) untuk metrik CPU, memori, dan latensi.
- **Alert** dapat dikonfigurasi via **Alertmanager** atau cloud provider jika penggunaan melebihi threshold.

## 8. Skalabilitas & Pembaruan

- **Update image** ketika ada perubahan kode atau dependensi:
```bash
docker compose --env-file .env.production pull
docker compose --env-file .env.production up -d --no-deps api nginx
```
- **Rolling restart** untuk meminimalkan downtime:
```bash
docker compose --env-file .env.production up -d --no-deps --build api
```
- **Skala horizontal** untuk service yang mendukung (misalnya API) dengan menambah replica di `docker-compose.yml` atau menggunakan Docker Swarm/Kubernetes.

## 9. Penjadwalan Backup Otomatis

- Tambahkan **cron job** pada host untuk menjalankan script backup harian:
```cron
0 2 * * * cd /path/to/ai-affiliate-os-production && ./pg_backup.sh >> /var/log/ai-affiliate-os/backup.log 2>&1
```
- Pastikan backup disimpan di storage terpisah atau cloud bucket untuk ketahanan data.

## 10. Catatan Tambahan

- Selalu **test** setelah perubahan konfigurasi SSL atau domain baru.
- Pastikan **firewall** hanya membuka port yang diperlukan.
- Dokumentasikan setiap perubahan pada **README.production.md** untuk tim.

## 11. Pengujian API dan Frontend

- **Uji endpoint kesehatan API**:
```bash
curl -k https://api.aiaffiliateos.com/healthz
```
- **Uji endpoint statistik** (contoh):
```bash
curl -k https://api.aiaffiliateos.com/v1/opportunity/score?tenant_id=1
```
- **Uji UI** dengan membuka domain aplikasi:
```bash
open https://app.aiaffiliateos.com
```
- Pastikan token otentikasi (misalnya JWT) tersedia dan disertakan pada header `Authorization: Bearer <token>` untuk endpoint yang memerlukan autentikasi.

## 12. Troubleshooting Umum

- **Container tidak dapat start**: periksa log dengan `docker compose logs <service>` untuk melihat error detail.
- **Masalah SSL**: pastikan port 80 dapat diakses secara publik selama proses ACME challenge, dan periksa file sertifikat di `infra/nginx/conf.d/ssl.conf`.
- **Database tidak terhubung**: pastikan variabel environment `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` di `.env.production` cocok dengan yang didefinisikan di `docker-compose.yml`.
- **Redis/RabbitMQ tidak responsif**: cek apakah port internal (6379, 5672) terbuka dalam network Docker Compose; gunakan `docker exec -it <container> redis-cli ping` atau `docker exec -it <container> rabbitmqctl status`.

## 13. Langkah Selanjutnya

- **Implementasi modul AI**: integrasikan provider AI (OpenAI, Anthropic, atau lokal) ke dalam service `opportunity` dan `content-intelligence`.
- **Shortlink service**: pilih solusi (Bitly API, TinyURL, atau self‑hosted) dan tambahkan endpoint `/shorten` pada API.
- **Notifikasi**: konfigurasi channel notifikasi (Telegram, Slack, atau email) untuk alert kesempatan tinggi.
- **Penjadwalan job**: gunakan cron atau library seperti `node-cron` untuk menjalankan perhitungan skor kesempatan setiap jam.
- **CI/CD pipeline**: siapkan GitHub Actions atau GitLab CI untuk otomatisasi build, test, dan deploy ke server produksi.

## 14. Referensi & Dokumentasi Tambahan

- Docker Compose docs: https://docs.docker.com/compose/
- Certbot manual: https://certbot.eff.org/docs/using.html
- Prisma schema guide: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- Prometheus & Grafana setup: https://grafana.com/docs/grafana/latest/installation/docker/

---

*Dokumen ini terus berkembang seiring penambahan fitur dan perbaikan. Pastikan selalu menarik perubahan terbaru dari repository.*