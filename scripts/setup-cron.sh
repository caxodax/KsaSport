#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE CONFIGURACIÓN AUTOMÁTICA DE CRONJOB - KSA SPORTS
# ==============================================================================
# Horarios: 9:30 AM y 4:30 PM (Hora de Venezuela)
# ==============================================================================

SCRIPT_PATH="/home/lmontes/Documentos/Telegram/KsaSport/scripts/scrape-alcambio.js"
LOG_PATH="/home/lmontes/Documentos/Telegram/KsaSport/data/scraper.log"
NODE_BIN=$(which node)

if [ -z "$NODE_BIN" ]; then
  NODE_BIN="/usr/bin/node"
fi

CRON_CMD="30 9,16 * * * $NODE_BIN $SCRIPT_PATH --sync >> $LOG_PATH 2>&1"

echo "=========================================================="
echo "🕒 Configuración de Cronjob para AlCambio.app Scraper"
echo "=========================================================="
echo "Comando a programar: $CRON_CMD"
echo ""

# Verificar si ya existe en crontab
crontab -l 2>/dev/null | grep -F "$SCRIPT_PATH" >/dev/null

if [ $? -eq 0 ]; then
  echo "✅ El cronjob ya se encuentra programado en crontab:"
  crontab -l | grep -F "$SCRIPT_PATH"
else
  (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
  echo "✨ ¡Cronjob instalado exitosamente!"
  echo ""
  echo "Tareas programadas actuales en tu usuario:"
  crontab -l
fi

echo "=========================================================="

