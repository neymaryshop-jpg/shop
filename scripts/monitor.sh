#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     NeymaryShop System Monitor            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

show_status() {
    local name=$1
    local status=$2
    
    if [ "$status" = "UP" ]; then
        echo -e "${name}: ${GREEN}●${NC} Running"
    else
        echo -e "${name}: ${RED}●${NC} Down"
    fi
}

echo -e "${YELLOW}═══ Docker Containers ═══${NC}"
services=("postgres" "redis" "backend" "frontend" "telegram_bot" "nginx")

for service in "${services[@]}"; do
    if docker compose ps | grep -q "neymaryshop_${service}.*Up"; then
        show_status "$service" "UP"
    else
        show_status "$service" "DOWN"
    fi
done

echo ""

echo -e "${YELLOW}═══ Resource Usage ═══${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep neymaryshop

echo ""

echo -e "${YELLOW}═══ WSL2 System Resources ═══${NC}"
echo -e "Memory:  $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo -e "Disk:    $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')"
echo -e "CPU:     $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')% used"

echo ""

echo -e "${YELLOW}═══ Database Status ═══${NC}"
if docker exec neymaryshop_db pg_isready -U neymary > /dev/null 2>&1; then
    echo -e "PostgreSQL: ${GREEN}●${NC} Connected"
    
    connections=$(docker exec neymaryshop_db psql -U neymary -d neymaryshop -t -c "SELECT count(*) FROM pg_stat_activity;")
    echo -e "Connections: ${connections// /}"
    
    db_size=$(docker exec neymaryshop_db psql -U neymary -d neymaryshop -t -c "SELECT pg_size_pretty(pg_database_size('neymaryshop'));")
    echo -e "DB Size: ${db_size// /}"
else
    echo -e "PostgreSQL: ${RED}●${NC} Not Connected"
fi

echo ""

echo -e "${YELLOW}═══ Redis Status ═══${NC}"
if docker exec neymaryshop_redis redis-cli ping > /dev/null 2>&1; then
    echo -e "Redis: ${GREEN}●${NC} Connected"
    
    redis_mem=$(docker exec neymaryshop_redis redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    echo -e "Memory: ${redis_mem}"
    
    redis_keys=$(docker exec neymaryshop_redis redis-cli dbsize | cut -d: -f2 | tr -d '\r')
    echo -e "Keys: ${redis_keys}"
else
    echo -e "Redis: ${RED}●${NC} Not Connected"
fi

echo ""

echo -e "${YELLOW}═══ Backend API ═══${NC}"
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "Status: ${GREEN}●${NC} Healthy"
    
    uptime=$(curl -s http://localhost:3001/health | grep -o '"uptime":[0-9.]*' | cut -d: -f2)
    if [ ! -z "$uptime" ]; then
        uptime_hours=$(echo "scale=2; $uptime / 3600" | bc)
        echo -e "Uptime: ${uptime_hours}h"
    fi
else
    echo -e "Status: ${RED}●${NC} Unhealthy"
fi

echo ""

echo -e "${YELLOW}═══ Frontend ═══${NC}"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "Status: ${GREEN}●${NC} Accessible"
else
    echo -e "Status: ${RED}●${NC} Not Accessible"
fi

echo ""

echo -e "${YELLOW}═══ Recent Errors ═══${NC}"
error_count=$(docker compose logs --tail=100 | grep -i "error" | wc -l)
if [ $error_count -eq 0 ]; then
    echo -e "${GREEN}No recent errors${NC}"
else
    echo -e "${RED}${error_count} errors in last 100 log lines${NC}"
    docker compose logs --tail=100 | grep -i "error" | tail -5
fi

echo ""

echo -e "${YELLOW}═══ Disk Space Alerts ═══${NC}"
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $disk_usage -gt 80 ]; then
    echo -e "${RED}⚠ Warning: Disk usage is ${disk_usage}%${NC}"
elif [ $disk_usage -gt 90 ]; then
    echo -e "${RED}🚨 Critical: Disk usage is ${disk_usage}%${NC}"
else
    echo -e "${GREEN}✓ Disk usage OK (${disk_usage}%)${NC}"
fi

echo ""

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Quick Actions                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "View logs:        docker compose logs -f [service]"
echo "Restart service:  docker compose restart [service]"
echo "Check health:     curl http://localhost:3001/health"
echo "Database shell:   docker exec -it neymaryshop_db psql -U neymary neymaryshop"
echo "Redis CLI:        docker exec -it neymaryshop_redis redis-cli"
echo ""

if [ "$1" = "--watch" ]; then
    echo "Обновление через 5 секунд... (Ctrl+C для выхода)"
    sleep 5
    exec $0 --watch
fi
