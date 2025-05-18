import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Lead, LeadStage } from "@/types/lead";

interface LeadsByStageChartProps {
  leads: Lead[];
}

// Stage colors with more vibrant colors for better visibility
const STAGE_COLORS = {
  new: "#3B82F6", // blue-500
  contacted: "#F59E0B", // amber-500
  qualified: "#10B981", // emerald-500
  proposal: "#8B5CF6", // violet-500
  project: "#6366F1", // indigo-500
  rejected: "#EF4444", // red-500
};

const LeadsByStageChart = ({ leads }: LeadsByStageChartProps) => {
  // Group leads by stage
  const leadsByStage = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.stage] = (acc[lead.stage] || 0) + 1;
    return acc;
  }, {});

  // Format data for chart
  const chartData = Object.entries(leadsByStage).map(([stage, count]) => ({
    name: formatStageName(stage as LeadStage),
    value: count,
    stage: stage,
  }));

  function formatStageName(stage: LeadStage): string {
    return {
      new: "New",
      contacted: "Contacted",
      qualified: "Qualified",
      proposal: "Proposal",
      project: "Project",
      rejected: "Rejected",
    }[stage];
  }

  // Handle empty data
  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm h-[300px]">
        <h3 className="text-lg font-medium mb-4">Leads by Stage</h3>
        <div className="flex items-center justify-center h-[200px] text-gray-500">
          No leads data available
        </div>
      </div>
    );
  }

  // Handle single category case
  if (chartData.length === 1) {
    const singleCategory = chartData[0];
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm h-[300px]">
        <h3 className="text-lg font-medium mb-4">Leads by Stage</h3>
        <div className="flex flex-col items-center justify-center h-[200px]">
          <div 
            className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: STAGE_COLORS[singleCategory.stage as LeadStage] }}
          >
            100%
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">{singleCategory.name}</p>
            <p className="text-gray-500">{singleCategory.value} leads ({Math.round(100)}%)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm h-[300px]">
      <h3 className="text-lg font-medium mb-4">Leads by Stage</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={STAGE_COLORS[entry.stage as LeadStage]} 
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} leads`, 'Count']} />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LeadsByStageChart;
