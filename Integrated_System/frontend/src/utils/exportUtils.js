export const exportToCSV = (data, filename) => {
    if (!data || !data.length) return;

    // Get headers
    const headers = Object.keys(data[0]);

    // Convert data to CSV string
    const csvRows = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header] === null || row[header] === undefined ? '' : row[header];
                // Escape commas and quotes
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        )
    ];

    const csvString = csvRows.join('\n');

    // Create Blob and download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const triggerPrint = () => {
    window.print();
};
