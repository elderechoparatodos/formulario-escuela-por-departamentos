/**
 * Admin Dashboard - La Otra Politica
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');
    
    // Verificar autenticacion
    if (!token) {
        window.location.href = '/admin';
        return;
    }

    // Elementos del DOM
    const departamentoFilter = document.getElementById('departamentoFilter');
    const departamentosGrid = document.getElementById('departamentosGrid');
    const inscripcionesBody = document.getElementById('inscripcionesBody');
    const tableCount = document.getElementById('tableCount');
    const currentDepartamento = document.getElementById('currentDepartamento');
    const totalInscritos = document.getElementById('totalInscritos');
    const tableEmpty = document.getElementById('tableEmpty');
    const downloadBtn = document.getElementById('downloadBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    let currentFilter = 'todos';

    // Verificar token
    verifyToken();

    // Event Listeners
    departamentoFilter.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        loadInscripciones(currentFilter);
        updateActiveCard(currentFilter);
    });

    downloadBtn.addEventListener('click', () => downloadExcel(currentFilter));
    refreshBtn.addEventListener('click', () => {
        loadDepartamentos();
        loadInscripciones(currentFilter);
    });
    logoutBtn.addEventListener('click', logout);

    // Funciones
    async function verifyToken() {
        try {
            const response = await fetch('/api/admin/verify', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Token invalido');
            }

            // Token valido, cargar datos
            loadDepartamentos();
            loadInscripciones('todos');

        } catch (error) {
            console.error('Error de autenticacion:', error);
            logout();
        }
    }

    async function loadDepartamentos() {
        try {
            console.log('Cargando departamentos...');
            const response = await fetch('/api/admin/departamentos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            console.log('Datos departamentos:', data);

            if (data.success) {
                console.log('Departamentos recibidos:', data.data);
                renderDepartamentos(data.data);
                totalInscritos.textContent = data.totalGeneral;
                
                // Actualizar select
                updateDepartamentoSelect(data.data);
            }

        } catch (error) {
            console.error('Error cargando departamentos:', error);
        }
    }

    function renderDepartamentos(departamentos) {
        console.log('Renderizando departamentos:', departamentos);
        console.log('departamentosGrid elemento:', departamentosGrid);
        
        // Agregar tarjeta de "Todos"
        let html = `
            <div class="dep-card ${currentFilter === 'todos' ? 'active' : ''}" data-dep="todos">
                <div class="dep-name">Todos</div>
                <div class="dep-count">${departamentos.reduce((sum, d) => sum + d.total, 0)}</div>
            </div>
        `;

        departamentos.forEach(dep => {
            if (dep._id) {
                html += `
                    <div class="dep-card ${currentFilter === dep._id ? 'active' : ''}" data-dep="${dep._id}">
                        <div class="dep-name">${dep._id}</div>
                        <div class="dep-count">${dep.total}</div>
                    </div>
                `;
            }
        });

        console.log('HTML generado:', html);
        departamentosGrid.innerHTML = html;

        // Agregar event listeners a las tarjetas
        document.querySelectorAll('.dep-card').forEach(card => {
            card.addEventListener('click', () => {
                const dep = card.dataset.dep;
                currentFilter = dep;
                departamentoFilter.value = dep;
                loadInscripciones(dep);
                updateActiveCard(dep);
            });
        });
    }

    function updateDepartamentoSelect(departamentos) {
        let options = '<option value="todos">Todos los departamentos</option>';
        
        departamentos.forEach(dep => {
            if (dep._id) {
                options += `<option value="${dep._id}">${dep._id} (${dep.total})</option>`;
            }
        });

        departamentoFilter.innerHTML = options;
        departamentoFilter.value = currentFilter;
    }

    function updateActiveCard(dep) {
        document.querySelectorAll('.dep-card').forEach(card => {
            card.classList.toggle('active', card.dataset.dep === dep);
        });

        currentDepartamento.textContent = dep === 'todos' ? '(Todos)' : `(${dep})`;
    }

    async function loadInscripciones(departamento) {
        try {
            const response = await fetch(`/api/admin/inscripciones/${encodeURIComponent(departamento)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                renderInscripciones(data.data);
                tableCount.textContent = `${data.total} registros`;
            }

        } catch (error) {
            console.error('Error cargando inscripciones:', error);
        }
    }

    function renderInscripciones(inscripciones) {
        if (inscripciones.length === 0) {
            inscripcionesBody.innerHTML = '';
            tableEmpty.classList.remove('hidden');
            return;
        }

        tableEmpty.classList.add('hidden');

        const html = inscripciones.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.nombre)}</td>
                <td>${escapeHtml(item.cedula)}</td>
                <td>${escapeHtml(item.telefono)}</td>
                <td>${escapeHtml(item.ciudad)}</td>
                <td>${escapeHtml(item.departamento)}</td>
                <td>${escapeHtml(item.profesion)}</td>
                <td>${escapeHtml(item.nombreEmprendimiento || '')}</td>
                <td>${escapeHtml(item.redesSociales || '')}</td>
                <td class="retos-cell" title="${escapeHtml(item.retosEmprendimiento || '')}">${escapeHtml(truncateText(item.retosEmprendimiento || '', 50))}</td>
                <td>${formatDate(item.fechaRegistro)}</td>
            </tr>
        `).join('');

        inscripcionesBody.innerHTML = html;
    }

    async function downloadExcel(departamento) {
        try {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = `
                <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Descargando...
            `;

            const response = await fetch(`/api/admin/descargar/${encodeURIComponent(departamento)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error descargando');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = departamento === 'todos' 
                ? 'inscripciones_todos.xlsx' 
                : `inscripciones_${departamento.replace(/\s+/g, '_')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

        } catch (error) {
            console.error('Error descargando Excel:', error);
            alert('Error al descargar el archivo');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar Excel
            `;
        }
    }

    function logout() {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
});
