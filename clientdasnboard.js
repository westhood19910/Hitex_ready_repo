  // Global variables for dashboard state
        let currentSection = 'dashboard';
        let manuscripts = [];
        
        document.addEventListener('DOMContentLoaded', async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };

            // Initialize dashboard
            await loadProfileInfo(headers);
            await loadManuscripts(headers);
            updateDashboardStats();
            setupNavigation();
            
            // Setup logout
            document.getElementById('logoutButton').addEventListener('click', logout);
        });

        // Load profile information
        async function loadProfileInfo(headers) {
            try {
                const response = await fetch('https://all-branched-end.onrender.com/profile', { headers });
                const profileData = await response.json();
                if (profileData) {
                    document.getElementById('profileName').textContent = profileData.fullName || 'Author';
                    document.getElementById('profileEmail').textContent = profileData.email || '';
                }
            } catch (err) {
                console.error('Failed to load profile info:', err);
            }
        }

        // Load manuscripts data
        async function loadManuscripts(headers) {
            try {
                const response = await fetch('https://all-branched-end.onrender.com/my-manuscripts', { headers });
                manuscripts = await response.json();
                
                // Populate submissions table
                const list = document.getElementById('manuscriptList');
                list.innerHTML = '';
                
                if (manuscripts.length === 0) {
                    list.innerHTML = '<tr><td colspan="6" style="text-align:center;">You have not submitted any manuscripts yet.</td></tr>';
                    return;
                }
                
                manuscripts.forEach((doc, index) => {
                    const statusClass = `state-${(doc.status || 'new').toLowerCase().replace(/\s+/g, '-')}`;
                    const row = list.insertRow();
                    row.innerHTML = `
                        <td>${new Date(doc.uploadDate).toLocaleDateString()}</td>
                        <td>${doc.originalName || doc.title}</td>
                        <td>${doc.wordCount || 'N/A'}</td>
                        <td>${doc.serviceType || 'Standard Edit'}</td>
                        <td><span class="state-indicator ${statusClass}">${doc.status || 'New'}</span></td>
                        <td>
                            <button class="op-button op-primary" onclick="viewManuscript(${index})">View</button>
                            <button class="op-button op-info" onclick="downloadManuscript(${index})">Download</button>
                        </td>
                    `;
                });
            } catch (err) {
                console.error('Failed to load manuscripts:', err);
            }
        }

        // Update dashboard statistics
        function updateDashboardStats() {
            document.getElementById('totalManuscripts').textContent = manuscripts.length;
            document.getElementById('activeProjects').textContent = manuscripts.filter(m => 
                ['assigned', 'in-progress', 'review'].includes((m.status || '').toLowerCase())
            ).length;
            document.getElementById('completedProjects').textContent = manuscripts.filter(m => 
                (m.status || '').toLowerCase() === 'completed'
            ).length;
            
            // Mock outstanding balance - in real app, this would come from API
            document.getElementById('outstandingBalance').textContent = '$0.00';
            
            // Update recent activity
            const recentActivity = document.getElementById('recentActivity');
            if (manuscripts.length > 0) {
                const recent = manuscripts.slice(0, 3);
                recentActivity.innerHTML = recent.map(m => `
                    <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--grey);">
                        <strong>${m.originalName || m.title}</strong> - Status: ${m.status || 'New'}
                        <br><small>${new Date(m.uploadDate).toLocaleDateString()}</small>
                    </div>
                `).join('');
            } else {
                recentActivity.innerHTML = '<p>No recent activity to display.</p>';
            }
        }

        // Setup navigation
        function setupNavigation() {
            document.querySelectorAll('.pillar-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const section = e.target.getAttribute('data-section');
                    if (section) {
                        showSection(section);
                        
                        // Update active nav
                        document.querySelectorAll('.pillar-link').forEach(l => l.classList.remove('active'));
                        e.target.classList.add('active');
                    }
                });
            });
        }

        // Show specific section
        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.view-segment').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show selected section
            const section = document.getElementById(sectionName + '-section');
            if (section) {
                section.style.display = 'block';
                currentSection = sectionName;
            }
        }

        // Tab switching functionality
        function switchTab(tabName) {
            document.querySelectorAll('.switcher-tab').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.switcher-pane').forEach(content => content.classList.remove('active'));
            
            document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
        }

        // View manuscript details
        function viewManuscript(index) {
            const manuscript = manuscripts[index];
            const modal = document.getElementById('manuscriptModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modalTitle.textContent = manuscript.originalName || manuscript.title;
            modalBody.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <strong>Upload Date:</strong> ${new Date(manuscript.uploadDate).toLocaleDateString()}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Word Count:</strong> ${manuscript.wordCount || 'Not specified'}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Service Type:</strong> ${manuscript.serviceType || 'Standard Edit'}
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Status:</strong> <span class="state-indicator state-${(manuscript.status || 'new').toLowerCase().replace(/\s+/g, '-')}">${manuscript.status || 'New'}</span>
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Description:</strong> ${manuscript.description || 'No description provided'}
                </div>
                ${manuscript.quote ? `
                    <div style="margin-bottom: 1rem;">
                        <strong>Quote:</strong> $${manuscript.quote}
                    </div>
                ` : ''}
                ${manuscript.editorNotes ? `
                    <div style="margin-bottom: 1rem;">
                        <strong>Editor Notes:</strong> ${manuscript.editorNotes}
                    </div>
                ` : ''}
                <div style="margin-top: 1.5rem;">
                    <button class="op-button op-primary" onclick="downloadManuscript(${index})">Download Original</button>
                    ${manuscript.editedVersion ? `
                        <button class="op-button op-confirm" onclick="downloadEditedVersion(${index})">Download Edited Version</button>
                    ` : ''}
                    <button class="op-button op-info" onclick="messageEditor(${index})">Message Editor</button>
                </div>
            `;
            
            modal.style.display = 'block';
        }

        // Close modal
        function closeModal() {
            document.getElementById('manuscriptModal').style.display = 'none';
        }

        // Download manuscript
        async function downloadManuscript(index) {
            const manuscript = manuscripts[index];
            const token = localStorage.getItem('authToken');
            
            try {
                const response = await fetch(`https://all-branched-end.onrender.com/download/${manuscript._id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = manuscript.originalName || 'manuscript.docx';
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else {
                    alert('Failed to download manuscript');
                }
            } catch (error) {
                console.error('Download error:', error);
                alert('Error downloading manuscript');
            }
        }

        // Download edited version
        async function downloadEditedVersion(index) {
            const manuscript = manuscripts[index];
            const token = localStorage.getItem('authToken');
            
            try {
                const response = await fetch(`https://all-branched-end.onrender.com/download-edited/${manuscript._id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `${manuscript.originalName || 'manuscript'}_edited.docx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else {
                    alert('Edited version not available yet');
                }
            } catch (error) {
                console.error('Download error:', error);
                alert('Error downloading edited manuscript');
            }
        }

        // Message editor functionality
        function messageEditor(index) {
            const manuscript = manuscripts[index];
            const message = prompt(`Send a message about "${manuscript.originalName || manuscript.title}":`);
            if (message && message.trim()) {
                alert('Message sent to editor successfully!');
                
                const notifications = document.getElementById('notifications');
                const newNotification = document.createElement('div');
                newNotification.className = 'alert-item';
                newNotification.innerHTML = `
                    <h4>Message Sent</h4>
                    <p>Your message about "${manuscript.originalName || manuscript.title}" has been sent to the editor.</p>
                `;
                notifications.insertBefore(newNotification, notifications.firstChild);
            }
        }

        // Export submissions
        function exportSubmissions() {
            if (manuscripts.length === 0) {
                alert('No submissions to export');
                return;
            }
            const headers = ['Date Submitted', 'Title', 'Word Count', 'Service Type', 'Status'];
            const csvContent = [
                headers.join(','),
                ...manuscripts.map(m => [
                    new Date(m.uploadDate).toLocaleDateString(),
                    `"${m.originalName || m.title}"`,
                    m.wordCount || 'N/A',
                    `"${m.serviceType || 'Standard Edit'}"`,
                    m.status || 'New'
                ].join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my_submissions.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }

        // Refresh dashboard
        async function refreshDashboard() {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            
            const refreshBtn = event.target;
            refreshBtn.textContent = 'Refreshing...';
            refreshBtn.disabled = true;
            
            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                await loadManuscripts(headers);
                updateDashboardStats();
                
                const notification = document.createElement('div');
                notification.className = 'alert-item';
                notification.innerHTML = `
                    <h4>Dashboard Updated</h4>
                    <p>Your dashboard has been refreshed with the latest information.</p>
                `;
                document.getElementById('notifications').insertBefore(notification, document.getElementById('notifications').firstChild);
                
            } catch (error) {
                console.error('Refresh error:', error);
                alert('Failed to refresh dashboard');
            } finally {
                refreshBtn.textContent = 'Refresh';
                refreshBtn.disabled = false;
            }
        }

        // Logout function
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userProfile');
                window.location.href = 'login.html';
            }
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('manuscriptModal');
            if (event.target === modal) {
                closeModal();
            }
        }