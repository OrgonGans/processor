// ==================== GLOBAL VARIABLES ====================

// Supermarket Simulation Variables
let singleCustomers = [];
let multiCustomers = [];
let simulationRunning = false;
let singleTime = 0;
let multiTime = 0;
let customerId = 0;
let singleInterval = null;
let multiInterval = null;
let timeInterval = null;

// Pipeline Simulation Variables
let instructions = [];
let instructionId = 0;
let pipelineRunning = false;
let currentView = 'single';
const pipelineStages = ['Fetch', 'Decode', 'Execute', 'Write Back'];

// Benchmark Data
const benchmarkData = {
    gaming: {
        '1 Core': 45,
        '2 Cores': 65,
        '4 Cores': 85,
        '6 Cores': 95,
        '8 Cores': 100
    },
    'video-editing': {
        '1 Core': 20,
        '2 Cores': 40,
        '4 Cores': 70,
        '6 Cores': 90,
        '8 Cores': 100
    },
    'web-browsing': {
        '1 Core': 60,
        '2 Cores': 80,
        '4 Cores': 95,
        '6 Cores': 98,
        '8 Cores': 100
    }
};

// ==================== DOM ELEMENTS ====================

// Supermarket Elements
const singleQueueElement = document.getElementById('single-queue');
const multiQueueElement = document.getElementById('multi-queue');
const singleCustomersElement = document.getElementById('single-customers');
const singleTimeElement = document.getElementById('single-time');
const multiCustomersElement = document.getElementById('multi-customers');
const multiTimeElement = document.getElementById('multi-time');
const addCustomerBtn = document.getElementById('add-customer');
const startSimulationBtn = document.getElementById('start-simulation');
const resetSimulationBtn = document.getElementById('reset-simulation');

// Pipeline Elements
const addInstructionBtn = document.getElementById('add-instruction');
const toggleCoreViewBtn = document.getElementById('toggle-core-view');
const startPipelineBtn = document.getElementById('start-pipeline');
const hazardExplanationBtn = document.getElementById('hazard-explanation');
const singlePipelineElement = document.getElementById('single-pipeline');
const multiPipelineElement = document.getElementById('multi-pipeline');

// Benchmark Elements
const workloadButtons = document.querySelectorAll('.workload-btn');
const runBenchmarkBtn = document.getElementById('run-benchmark');

// Quiz Elements
const quizOptions = document.querySelectorAll('.quiz-option');
const getRecommendationBtn = document.getElementById('get-recommendation');
const recommendationResult = document.getElementById('recommendation-result');

// Other Elements
const scrollToTopBtn = document.getElementById('scrollToTop');
const glossaryTerms = document.querySelectorAll('.glossary-term');

// ==================== UTILITY FUNCTIONS ====================

/**
 * Menampilkan notifikasi kepada pengguna
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - Jenis notifikasi ('info', 'warning', 'success', 'error')
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger show animation
    setTimeout(() => {
        notification.classList.add('show');
        notification.classList.add('pulse');
    }, 10);
    
    // Auto hide setelah 4 detik
    setTimeout(() => {
        notification.classList.remove('show', 'pulse');
        notification.classList.add('hide');
        
        // Remove dari DOM setelah animasi selesai
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 600);
    }, 4000);
}

/**
 * Membuat modal untuk penjelasan hazards
 */
function createHazardModal() {
    const modal = document.createElement('div');
    modal.className = 'hazard-modal';
    modal.innerHTML = `
        <div class="hazard-content">
            <h3>Pipeline Hazards</h3>
            <p><strong>Data Hazard:</strong> Terjadi ketika instruksi bergantung pada hasil instruksi sebelumnya.</p>
            <p><strong>Structural Hazard:</strong> Terjadi ketika beberapa instruksi membutuhkan resource yang sama.</p>
            <p><strong>Control Hazard:</strong> Terjadi karena branch instructions (if, loop).</p>
            <p><strong>Multi-core mengatasi hazards dengan:</strong></p>
            <ul>
                <li>Memproses instruksi di core berbeda</li>
                <li>Mengurangi ketergantungan data</li>
                <li>Resource yang dedicated per core</li>
            </ul>
            <button class="close-modal">Tutup</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners untuk modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.classList.contains('close-modal')) {
            modal.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        }
    });
    
    return modal;
}

// ==================== SUPERMARKET SIMULATION ====================

/**
 * Menambah pelanggan baru ke simulasi
 */
function addCustomer() {
    if (simulationRunning) {
        showNotification('Simulasi sedang berjalan! Tunggu hingga selesai.', 'warning');
        return;
    }
    
    customerId++;
    const customer = {
        id: customerId,
        processingTime: 2
    };
    
    singleCustomers.push({...customer});
    multiCustomers.push({...customer});
    
    updateQueueDisplay();
    updateCustomerCounts();
}

/**
 * Memperbarui tampilan antrian pelanggan
 */
function updateQueueDisplay() {
    // Update single queue
    singleQueueElement.innerHTML = '';
    singleCustomers.forEach(customer => {
        const customerElement = createCustomerElement(customer);
        singleQueueElement.appendChild(customerElement);
    });
    
    // Update multi queue
    multiQueueElement.innerHTML = '';
    multiCustomers.forEach(customer => {
        const customerElement = createCustomerElement(customer);
        multiQueueElement.appendChild(customerElement);
    });
}

/**
 * Membuat elemen pelanggan
 * @param {Object} customer - Data pelanggan
 * @returns {HTMLElement} Elemen pelanggan
 */
function createCustomerElement(customer) {
    const element = document.createElement('div');
    element.className = 'customer';
    element.textContent = customer.id;
    element.dataset.id = customer.id;
    element.title = `Pelanggan ${customer.id}`;
    return element;
}

/**
 * Memperbarui jumlah pelanggan yang ditampilkan
 */
function updateCustomerCounts() {
    singleCustomersElement.textContent = singleCustomers.length;
    multiCustomersElement.textContent = multiCustomers.length;
}

/**
 * Memperbarui tampilan waktu
 */
function updateTimeDisplays() {
    singleTimeElement.textContent = `${singleTime}s`;
    multiTimeElement.textContent = `${multiTime}s`;
}

/**
 * Memulai simulasi supermarket
 */
function startSimulation() {
    if (singleCustomers.length === 0) {
        showNotification('Tidak ada pelanggan! Silakan tambah pelanggan terlebih dahulu.', 'warning');
        return;
    }

    if (simulationRunning) return;
    
    simulationRunning = true;
    startSimulationBtn.disabled = true;
    addCustomerBtn.disabled = true;

    singleTime = 0;
    multiTime = 0;
    
    updateTimeDisplays();
    startSimulationIntervals();
    startTimeUpdate();
}

/**
 * Memulai interval untuk simulasi
 */
function startSimulationIntervals() {
    // Single-core interval
    singleInterval = setInterval(() => {
        if (!simulationRunning || singleCustomers.length === 0) {
            clearInterval(singleInterval);
            return;
        }
        
        // Highlight customer pertama
        const customers = document.querySelectorAll('#single-queue .customer');
        if (customers.length > 0) {
            customers[0].classList.add('processing');
        }

        // Hapus 1 customer setelah delay untuk animasi
        setTimeout(() => {
            if (singleCustomers.length > 0) {
                singleCustomers.shift();
                updateQueueDisplay();
                updateCustomerCounts();
                
                if (singleCustomers.length === 0) {
                    clearInterval(singleInterval);
                    checkSimulationComplete();
                }
            }
        }, 200);
        
    }, 1000);
    
    // Multi-core interval
    multiInterval = setInterval(() => {
        if (!simulationRunning || multiCustomers.length === 0) {
            clearInterval(multiInterval);
            return;
        }
        
        // Highlight hingga 4 customer
        const customers = document.querySelectorAll('#multi-queue .customer');
        const customersToProcess = Math.min(4, multiCustomers.length);
        
        for (let i = 0; i < customersToProcess; i++) {
            customers[i].classList.add('processing');
        }
        
        // Hapus customers setelah delay untuk animasi
        setTimeout(() => {
            if (multiCustomers.length > 0) {
                multiCustomers.splice(0, customersToProcess);
                updateQueueDisplay();
                updateCustomerCounts();
                
                if (multiCustomers.length === 0) {
                    clearInterval(multiInterval);
                    checkSimulationComplete();
                }
            }
        }, 200);
        
    }, 1000);
}

/**
 * Memulai pembaruan waktu
 */
function startTimeUpdate() {
    timeInterval = setInterval(() => {
        if (!simulationRunning) {
            clearInterval(timeInterval);
            return;
        }
        
        if (singleCustomers.length > 0) singleTime++;
        if (multiCustomers.length > 0) multiTime++;
        
        updateTimeDisplays();
        
        if (singleCustomers.length === 0 && multiCustomers.length === 0) {
            clearInterval(timeInterval);
            simulationRunning = false;
            startSimulationBtn.disabled = false;
            addCustomerBtn.disabled = false;
            showComparisonResult();
        }
    }, 1000);
}

/**
 * Memeriksa apakah simulasi sudah selesai
 */
function checkSimulationComplete() {
    if (singleCustomers.length === 0 && multiCustomers.length === 0) {
        simulationRunning = false;
        startSimulationBtn.disabled = false;
        addCustomerBtn.disabled = false;
        showComparisonResult();
    }
}

/**
 * Menampilkan hasil perbandingan simulasi
 */
function showComparisonResult() {
    const efficiency = ((singleTime - multiTime) / singleTime * 100).toFixed(1);
    let message = '';
    let type = 'info';
    
    if (multiTime < singleTime) {
        message = `Multi-core ${efficiency}% lebih cepat!\n⏱️ Single: ${singleTime}s | ⏱️ Multi: ${multiTime}s`;
        type = 'success';
    } else if (multiTime > singleTime) {
        message = `Single-core ${Math.abs(efficiency)}% lebih cepat!\n⏱️ Single: ${singleTime}s | ⏱️ Multi: ${multiTime}s`;
        type = 'info';
    } else {
        message = `Kedua arsitektur sama cepat!\n⏱️ Waktu: ${singleTime}s`;
        type = 'info';
    }

    showNotification(message, type);
}

/**
 * Mereset simulasi supermarket
 */
function resetSimulation() {
    clearInterval(singleInterval);
    clearInterval(multiInterval);
    clearInterval(timeInterval);
    
    simulationRunning = false;
    singleCustomers = [];
    multiCustomers = [];
    customerId = 0;
    singleTime = 0;
    multiTime = 0;
    
    updateQueueDisplay();
    updateCustomerCounts();
    updateTimeDisplays();
    
    startSimulationBtn.disabled = false;
    addCustomerBtn.disabled = false;
}

// ==================== PIPELINE SIMULATION ====================

/**
 * Menginisialisasi pipeline multi-core
 */
function initializeMultiPipeline() {
    multiPipelineElement.innerHTML = '';
    
    for (let core = 0; core < 4; core++) {
        const corePipeline = document.createElement('div');
        corePipeline.className = 'pipeline-core';
        corePipeline.innerHTML = `
            <h4>Core ${core + 1}</h4>
            <div class="pipeline">
                ${pipelineStages.map(stage => `
                    <div class="pipeline-stage">
                        <div class="stage-title">${stage}</div>
                        <div class="instructions-container" data-core="${core}" data-stage="${stage.toLowerCase().replace(' ', '-')}"></div>
                    </div>
                `).join('')}
            </div>
        `;
        multiPipelineElement.appendChild(corePipeline);
    }
}

/**
 * Menambah instruksi baru ke pipeline
 */
function addInstruction() {
    if (pipelineRunning) {
        showNotification('Pipeline sedang berjalan! Tunggu hingga selesai.', 'warning');
        return;
    }
    
    instructionId++;
    const instruction = {
        id: instructionId,
        name: `INST${instructionId}`,
        currentStage: -1,
        completed: false,
        core: null
    };
    
    instructions.push(instruction);
    updatePipelineDisplay();
}

/**
 * Memperbarui tampilan pipeline
 */
function updatePipelineDisplay() {
    // Clear semua container
    document.querySelectorAll('.instructions-container').forEach(container => {
        container.innerHTML = '';
    });
    
    // Tampilkan instruksi berdasarkan view
    instructions.forEach(instruction => {
        if (instruction.currentStage >= 0 && !instruction.completed) {
            const stageName = pipelineStages[instruction.currentStage].toLowerCase().replace(' ', '-');
            
            if (currentView === 'single') {
                const container = document.querySelector(`.pipeline-stage:nth-child(${instruction.currentStage + 1}) .instructions-container`);
                if (container) {
                    const instElement = createInstructionElement(instruction);
                    container.appendChild(instElement);
                }
            } else {
                if (instruction.core !== null) {
                    const container = document.querySelector(`.instructions-container[data-core="${instruction.core}"][data-stage="${stageName}"]`);
                    if (container) {
                        const instElement = createInstructionElement(instruction);
                        container.appendChild(instElement);
                    }
                }
            }
        }
    });
}

/**
 * Membuat elemen instruksi
 * @param {Object} instruction - Data instruksi
 * @returns {HTMLElement} Elemen instruksi
 */
function createInstructionElement(instruction) {
    const element = document.createElement('div');
    element.className = `instruction ${instruction.completed ? 'completed' : ''}`;
    element.textContent = instruction.name;
    element.title = `Instruksi ${instruction.name}`;
    return element;
}

/**
 * Men-toggle tampilan antara single dan multi core
 */
function toggleCoreView() {
    if (pipelineRunning) {
        showNotification('Pipeline sedang berjalan! Tunggu hingga selesai.', 'warning');
        return;
    }
    
    currentView = currentView === 'single' ? 'multi' : 'single';
    
    if (currentView === 'single') {
        singlePipelineElement.style.display = 'flex';
        multiPipelineElement.style.display = 'none';
        toggleCoreViewBtn.textContent = 'Switch to Multi-Core';
    } else {
        singlePipelineElement.style.display = 'none';
        multiPipelineElement.style.display = 'block';
        toggleCoreViewBtn.textContent = 'Switch to Single-Core';
        initializeMultiPipeline();
    }
    
    updatePipelineDisplay();
}

/**
 * Memulai simulasi pipeline
 */
function startPipeline() {
    if (pipelineRunning) {
        showNotification('Pipeline sudah berjalan!', 'warning');
        return;
    }
    
    if (instructions.length === 0) {
        showNotification('Tidak ada instruksi! Silakan tambah instruksi terlebih dahulu.', 'warning');
        return;
    }
    
    pipelineRunning = true;
    startPipelineBtn.disabled = true;
    addInstructionBtn.disabled = true;
    toggleCoreViewBtn.disabled = true;
    
    // Reset semua instruksi
    instructions.forEach(instruction => {
        instruction.currentStage = -1;
        instruction.completed = false;
        instruction.core = null;
    });
    
    runPipelineSimulation();
}

/**
 * Menjalankan simulasi pipeline
 */
function runPipelineSimulation() {
    let cycle = 0;
    const maxCycles = 20;
    
    const pipelineInterval = setInterval(() => {
        cycle++;
        
        if (currentView === 'single') {
            simulateSingleCorePipeline(cycle);
        } else {
            simulateMultiCorePipeline(cycle);
        }
        
        updatePipelineDisplay();
        
        const allCompleted = instructions.every(instruction => instruction.completed);
        if (allCompleted || cycle >= maxCycles) {
            clearInterval(pipelineInterval);
            pipelineRunning = false;
            startPipelineBtn.disabled = false;
            addInstructionBtn.disabled = false;
            toggleCoreViewBtn.disabled = false;
            
            showPipelineResult(cycle, allCompleted);
        }
    }, 1000);
}

/**
 * Simulasi pipeline single-core
 * @param {number} cycle - Cycle saat ini
 */
function simulateSingleCorePipeline(cycle) {
    if (cycle === 1) {
        instructions.forEach((instruction, index) => {
            instruction.currentStage = -1;
            instruction.completed = false;
        });
    }
    
    instructions.forEach((instruction, index) => {
        if (instruction.currentStage === -1 && index === 0) {
            instruction.currentStage = 0;
        } else if (instruction.currentStage >= 0 && !instruction.completed) {
            const prevInstruction = index > 0 ? instructions[index - 1] : null;
            if (!prevInstruction || prevInstruction.currentStage > instruction.currentStage) {
                instruction.currentStage++;
                
                if (instruction.currentStage >= pipelineStages.length) {
                    instruction.completed = true;
                }
            }
        }
    });
}

/**
 * Simulasi pipeline multi-core
 * @param {number} cycle - Cycle saat ini
 */
function simulateMultiCorePipeline(cycle) {
    if (cycle === 1) {
        instructions.forEach((instruction, index) => {
            instruction.currentStage = -1;
            instruction.completed = false;
            instruction.core = index % 4;
        });
    }
    
    for (let core = 0; core < 4; core++) {
        const coreInstructions = instructions.filter(inst => inst.core === core);
        
        coreInstructions.forEach((instruction, index) => {
            if (instruction.currentStage === -1 && index === 0) {
                instruction.currentStage = 0;
            } else if (instruction.currentStage >= 0 && !instruction.completed) {
                const prevInstruction = index > 0 ? coreInstructions[index - 1] : null;
                if (!prevInstruction || prevInstruction.currentStage > instruction.currentStage) {
                    instruction.currentStage++;
                    
                    if (instruction.currentStage >= pipelineStages.length) {
                        instruction.completed = true;
                    }
                }
            }
        });
    }
}

/**
 * Menampilkan hasil simulasi pipeline
 * @param {number} cycles - Jumlah cycles yang dijalankan
 * @param {boolean} completed - Apakah semua instruksi selesai
 */
function showPipelineResult(cycles, completed) {
    const completedInstructions = instructions.filter(inst => inst.completed).length;
    const totalInstructions = instructions.length;
    const efficiency = ((completedInstructions / totalInstructions) * 100).toFixed(1);
    
    let message = '';
    if (completed) {
        message = `Semua ${totalInstructions} instruksi selesai dalam ${cycles} cycles!`;
    } else {
        message = `${completedInstructions} dari ${totalInstructions} instruksi selesai dalam ${cycles} cycles (${efficiency}% efisiensi).`;
    }
    
    if (currentView === 'multi') {
        message += " Multi-core memproses instruksi secara paralel!";
    } else {
        message += " Single-core memproses instruksi secara berurutan.";
    }
    
    showNotification(message, completed ? 'success' : 'info');
}

/**
 * Menampilkan penjelasan tentang pipeline hazards
 */
function showHazardExplanation() {
    const modal = createHazardModal();
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

// ==================== BENCHMARK CHART ====================

/**
 * Menginisialisasi chart benchmark
 */
function initializeBenchmarkChart() {
    const svgWidth = 600;
    const svgHeight = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;
    
    const svg = d3.select("#benchmark-chart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
    
    const yScale = d3.scaleLinear()
        .range([height, 0]);
    
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);
    
    g.append("g")
        .attr("class", "y-axis");
    
    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "chart-tooltip")
        .style("opacity", 0);
    
    /**
     * Memperbarui chart dengan data workload tertentu
     * @param {string} workload - Jenis workload
     */
    function updateChart(workload) {
        const data = Object.entries(benchmarkData[workload]).map(([core, performance]) => ({
            core,
            performance
        }));
        
        xScale.domain(data.map(d => d.core));
        yScale.domain([0, 100]);
        
        // Perbarui sumbu
        g.select(".x-axis")
            .transition()
            .duration(500)
            .call(xAxis);
        
        g.select(".y-axis")
            .transition()
            .duration(500)
            .call(yAxis);
        
        // Bind data
        const bars = g.selectAll(".bar")
            .data(data, d => d.core);
        
        // Keluar
        bars.exit()
            .transition()
            .duration(500)
            .attr("y", height)
            .attr("height", 0)
            .remove();
        
        // Masuk
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.core))
            .attr("y", height)
            .attr("width", xScale.bandwidth())
            .attr("height", 0)
            .attr("fill", "#00ff9d")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`Performance: ${d.performance}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                
                d3.select(this).style("opacity", 0.7);
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                
                d3.select(this).style("opacity", 1);
            })
            .merge(bars)
            .transition()
            .duration(500)
            .attr("x", d => xScale(d.core))
            .attr("y", d => yScale(d.performance))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - yScale(d.performance));
        
        // Perbarui label
        const labels = g.selectAll(".label")
            .data(data, d => d.core);
        
        labels.exit().remove();
        
        labels.enter()
            .append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .merge(labels)
            .transition()
            .duration(500)
            .attr("x", d => xScale(d.core) + xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.performance) - 5)
            .text(d => `${d.performance}%`);
    }
    
    return updateChart;
}

/**
 * Menjalankan benchmark
 */
function runBenchmark() {
    const activeWorkload = document.querySelector('.workload-btn.active').dataset.workload;
    
    // Animasi loading
    const originalText = runBenchmarkBtn.innerHTML;
    runBenchmarkBtn.innerHTML = '<span class="loading">⏳</span> Menjalankan...';
    runBenchmarkBtn.disabled = true;
    
    setTimeout(() => {
        updateChart(activeWorkload);
        runBenchmarkBtn.innerHTML = originalText;
        runBenchmarkBtn.disabled = false;
        showNotification(`Benchmark ${activeWorkload} selesai!`, 'success');
    }, 1500);
}

// ==================== QUIZ RECOMMENDATION ====================

/**
 * Mengumpulkan jawaban quiz dan memberikan rekomendasi
 */
function getRecommendation() {
    const answers = {
        usage: null,
        budget: null,
        applications: null
    };
    
    // Kumpulkan jawaban
    document.querySelectorAll('.quiz-question').forEach((question, index) => {
        const selectedOption = question.querySelector('.quiz-option.selected');
        if (selectedOption) {
            if (index === 0) answers.usage = selectedOption.dataset.value;
            else if (index === 1) answers.budget = selectedOption.dataset.value;
            else if (index === 2) answers.applications = selectedOption.dataset.value;
        }
    });
    
    // Validasi jawaban
    if (!answers.usage || !answers.budget || !answers.applications) {
        showNotification('Silakan jawab semua pertanyaan terlebih dahulu!', 'warning');
        return;
    }
    
    // Berikan rekomendasi berdasarkan jawaban
    let recommendation = '';
    let title = '';
    let icon = '💡';
    
    if (answers.usage === 'gaming') {
        title = 'Rekomendasi: CPU dengan Single-Core Performance Tinggi';
        recommendation = 'Untuk gaming, kinerja single-core yang tinggi lebih penting daripada jumlah core. Pilih CPU dengan clock speed tinggi dan IPC (Instructions Per Cycle) yang baik. CPU dengan 6-8 core biasanya sudah cukup untuk sebagian besar game.';
        icon = '🎮';
    } else if (answers.usage === 'content-creation') {
        title = 'Rekomendasi: CPU Multi-Core dengan Banyak Core';
        recommendation = 'Untuk konten kreatif seperti video editing dan 3D rendering, CPU dengan banyak core akan memberikan performa yang jauh lebih baik. Carilah CPU dengan setidaknya 8 core, atau lebih jika budget memungkinkan.';
        icon = '🎨';
    } else if (answers.usage === 'programming') {
        title = 'Rekomendasi: CPU dengan Keseimbangan Single dan Multi-Core';
        recommendation = 'Untuk programming, Anda membutuhkan keseimbangan antara single-core performance untuk IDE dan tools development, serta multi-core performance untuk kompilasi kode dan menjalankan multiple services. CPU dengan 6-12 core adalah pilihan yang baik.';
        icon = '💻';
    } else {
        title = 'Rekomendasi: CPU dengan Keseimbangan yang Baik';
        recommendation = 'Untuk penggunaan produktivitas umum, carilah CPU yang menawarkan keseimbangan antara single-core performance dan jumlah core. CPU dengan 4-8 core biasanya sudah lebih dari cukup untuk kebutuhan office dan browsing.';
        icon = '⚖️';
    }
    
    // Sesuaikan berdasarkan budget
    if (answers.budget === 'low') {
        recommendation += ' Dengan budget terbatas, pertimbangkan CPU entry-level dengan 4-6 core yang menawarkan value terbaik.';
    } else if (answers.budget === 'medium') {
        recommendation += ' Dengan budget menengah, Anda dapat mempertimbangkan CPU mid-range dengan 6-8 core yang menawarkan performa yang seimbang.';
    } else if (answers.budget === 'high') {
        recommendation += ' Dengan budget tinggi, Anda dapat memilih CPU high-end dengan 12+ core untuk performa maksimal dalam semua scenario.';
    }
    
    // Tampilkan hasil
    recommendationResult.innerHTML = `
        <h3>${icon} ${title}</h3>
        <p>${recommendation}</p>
    `;
    recommendationResult.classList.add('show');
    
    // Scroll ke hasil
    recommendationResult.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// ==================== GLOSSARY FUNCTIONS ====================

/**
 * Menginisialisasi fungsi toggle untuk glossary
 */
function initializeGlossary() {
    glossaryTerms.forEach(term => {
        const toggle = term.querySelector('.term-toggle');
        const definition = term.querySelector('.term-definition');
        
        toggle.addEventListener('click', function() {
            definition.classList.toggle('expanded');
            toggle.textContent = definition.classList.contains('expanded') ? '-' : '+';
        });
    });
}

// ==================== SCROLL FUNCTIONS ====================

/**
 * Mengatur smooth scrolling untuk navigation links
 */
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Mengatur scroll to top button
 */
function initializeScrollToTop() {
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.display = 'flex';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });

    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Mengatur active navigation berdasarkan scroll position
 */
function initializeActiveNavigation() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });
}

// ==================== INITIALIZATION ====================

/**
 * Menginisialisasi semua event listeners
 */
function initializeEventListeners() {
    // Supermarket Simulation
    addCustomerBtn.addEventListener('click', addCustomer);
    startSimulationBtn.addEventListener('click', startSimulation);
    resetSimulationBtn.addEventListener('click', resetSimulation);
    
    // Pipeline Simulation
    addInstructionBtn.addEventListener('click', addInstruction);
    toggleCoreViewBtn.addEventListener('click', toggleCoreView);
    startPipelineBtn.addEventListener('click', startPipeline);
    hazardExplanationBtn.addEventListener('click', showHazardExplanation);
    
    // Benchmark
    workloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            workloadButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            updateChart(this.dataset.workload);
        });
    });
    runBenchmarkBtn.addEventListener('click', runBenchmark);
    
    // Quiz
    quizOptions.forEach(option => {
        option.addEventListener('click', function() {
            const question = this.parentElement;
            const options = question.querySelectorAll('.quiz-option');
            options.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    getRecommendationBtn.addEventListener('click', getRecommendation);
    
    // Scroll and Navigation
    initializeSmoothScrolling();
    initializeScrollToTop();
    initializeActiveNavigation();
}

/**
 * Menginisialisasi aplikasi saat DOM siap
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi chart benchmark
    const updateChart = initializeBenchmarkChart();
    updateChart('gaming');
    
    // Inisialisasi pipeline multi-core
    initializeMultiPipeline();
    
    // Inisialisasi glossary
    initializeGlossary();
    
    // Inisialisasi event listeners
    initializeEventListeners();
    
    // Inisialisasi state awal
    updateCustomerCounts();
    updateTimeDisplays();
    
    console.log('Aplikasi Single-Core vs Multi-Core berhasil diinisialisasi!');
});