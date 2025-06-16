import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import ParentCard from 'src/components/shared/ParentCard';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Graph Display',
  },
];

const GraphPage = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('graphData');
    console.log('Graph data loaded:', data); // Debugging
    if (data) {
      setGraphData(JSON.parse(data));
    }
  }, []);

  if (!graphData) {
    console.log('Graph data is empty.');
    return (
      <PageContainer title="Graph Display" description="No data available">
        <Breadcrumb title="Graph Display" items={BCrumb} />
        <ParentCard title="Graph Display">
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Aucun graphique à afficher. Veuillez réessayer.
          </div>
        </ParentCard>
      </PageContainer>
    );
  }

  console.log('Graph data is:', graphData);

  const chartOptions = {
    chart: {
      type: graphData.chart.type || 'line',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: '#adb0bb',
      zoom: { type: 'x', enabled: true },
      toolbar: { show: true },
    },
    xaxis: graphData.xaxis || { categories: [], title: { text: 'X-axis' } },
    yaxis: graphData.yaxis || { title: { text: 'Y-axis' } },
    colors: [primary, secondary],
    dataLabels: { enabled: true },
    stroke: { curve: 'smooth', width: 2 },
    tooltip: { theme: 'dark' },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      offsetY: -25,
      offsetX: -5,
    },
  };

  return (
    <PageContainer title="Graph Display" description="Dynamic Graph Viewer">
      <Breadcrumb title="Graph Display" items={BCrumb} />
      <ParentCard title="Graph Display">
        <Chart
          options={chartOptions}
          series={graphData.series || []}
          type={graphData.chart.type || 'line'}
          height={graphData.chart.height || '350px'}
          width="90%"
        />
      </ParentCard>
    </PageContainer>
  );
};

export default GraphPage;
