from prometheus_client import Counter, Gauge, start_http_server
import threading

# Metrics
command_counter = Counter('samantha_commands_total', 'Total commands processed')
command_success = Counter('samantha_commands_success', 'Successful commands')
command_fail = Counter('samantha_commands_fail', 'Failed commands')
cpu_gauge = Gauge('samantha_cpu_percent', 'CPU usage percent')
memory_gauge = Gauge('samantha_memory_percent', 'Memory usage percent')
disk_gauge = Gauge('samantha_disk_percent', 'Disk usage percent')


def start_metrics_server(port=8001):
    threading.Thread(target=start_http_server, args=(port,), daemon=True).start()


def update_system_metrics(cpu, memory, disk):
    cpu_gauge.set(cpu)
    memory_gauge.set(memory)
    disk_gauge.set(disk)
