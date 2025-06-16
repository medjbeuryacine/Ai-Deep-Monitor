import React from 'react';
import Chart from 'react-apexcharts';

const Graph = ({ data }) => {
  const chartOptions = {
    chart: {
      id: 'basic-chart',
      toolbar: { show: false },
    },
    xaxis: {
      categories: data.labels, // Les étiquettes de l'axe des X
    },
    colors: ['#1e88e5'], // Couleur de la série
    dataLabels: {
      enabled: false, // Pas d'étiquettes sur les points
    },
  };

  const chartSeries = [
    {
      name: data.label || 'Données',
      data: data.values, // Les valeurs de la série
    },
  ];

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <Chart options={chartOptions} series={chartSeries} type="line" height="300" />
    </div>
  );
};

export default Graph;
