import { useState, useEffect } from 'react';

export default function FilterSidebar({ filters, onFilterChange, locations }) {
    const handleCheckboxChange = (category, value) => {
        const currentValues = filters[category];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        onFilterChange(category, newValues);
    };

    const handleLocationChange = (e) => {
        onFilterChange('location', e.target.value);
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-rounded text-indigo-600">filter_list</span>
                Filters
            </h3>

            {/* Cost Filter */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Cost</h4>
                <div className="space-y-2">
                    {['Free', 'Low Cost', 'Moderate', 'High'].map(cost => (
                        <label key={cost} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.cost.includes(cost)}
                                onChange={() => handleCheckboxChange('cost', cost)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                            />
                            <span className="text-gray-600 group-hover:text-indigo-600 transition-colors text-sm">{cost}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Time Filter */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Time</h4>
                <div className="space-y-2">
                    {['Quick (<1 hr)', 'Medium (1-4 hrs)', 'Long (1 day+)', 'Ongoing'].map(time => (
                        <label key={time} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.time.includes(time)}
                                onChange={() => handleCheckboxChange('time', time)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                            />
                            <span className="text-gray-600 group-hover:text-indigo-600 transition-colors text-sm">{time}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Group Filter */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Group</h4>
                <div className="space-y-2">
                    {['Kids', 'Youth', 'Adults', 'Community', 'Mixed Group'].map(group => (
                        <label key={group} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={filters.group.includes(group)}
                                onChange={() => handleCheckboxChange('group', group)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                            />
                            <span className="text-gray-600 group-hover:text-indigo-600 transition-colors text-sm">{group}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Location Filter */}
            <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Location</h4>
                <select
                    value={filters.location}
                    onChange={handleLocationChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                >
                    <option value="">All Locations</option>
                    {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
