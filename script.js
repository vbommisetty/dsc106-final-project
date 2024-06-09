document.addEventListener('DOMContentLoaded', function() {
    // Line plot
    const lineData = [
        { year: 2022, population: 39040616, change: -0.27 },
        { year: 2021, population: 39145060, change: -0.91 },
        { year: 2020, population: 39503200, change: 0.17 },
        { year: 2019, population: 39437610, change: 0.00 },
        { year: 2018, population: 39437463, change: 0.25 },
        { year: 2017, population: 39337785, change: 0.48 },
        { year: 2016, population: 39149186, change: 0.63 },
        { year: 2015, population: 38904296, change: 0.82 },
        { year: 2014, population: 38586706, change: 0.87 },
        { year: 2013, population: 38253768, change: 0.81 },
        { year: 2012, population: 37944551, change: 0.82 },
        { year: 2011, population: 37636311, change: 0.85 },
        { year: 2010, population: 37319550, change: 0.97 }
    ];

    const margin = { top: 20, right: 30, bottom: 30, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
        .domain(d3.extent(lineData, d => d.year))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(lineData, d => d.population) - 200000, d3.max(lineData, d => d.population)])
        .range([height, 0]);

    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.population));

    const svgLinePlot = d3.select('#line-plot')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    svgLinePlot.append("text")
        .attr("x", width / 2)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("California Population Over Time");

    svgLinePlot.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d')));

    svgLinePlot.append('g')
        .call(d3.axisLeft(y).tickFormat(d3.format(',')));

    svgLinePlot.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', line);

    const tooltipLine = d3.select('#tooltip-line');

    svgLinePlot.selectAll('circle')
        .data(lineData)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d.population))
        .attr('r', 5)
        .attr('fill', 'steelblue')
        .on('mouseover', function(event, d) {
            tooltipLine
                .style('left', (event.pageX + 20) + 'px')
                .style('top', (event.pageY - 20) + 'px')
                .style('visibility', 'visible')
                .html(`Year: ${d.year}<br>Population: ${d3.format(',')(d.population)}`);
        })
        .on('mousemove', function(event, d) {
            tooltipLine
                .style('left', (event.pageX + 20) + 'px')
                .style('top', (event.pageY - 20) + 'px');
        })
        .on('mouseout', function() {
            tooltipLine.style('visibility', 'hidden');
        });
    const projection = d3.geoAlbersUsa()
        .translate([width / 1.75, height / 1.45])
        .scale(1000);
    const path = d3.geoPath().projection(projection);
    const path2 = d3.geoPath().projection(projection);
    const svg = d3.select("#map");
    const tooltip = d3.select("#tooltip");
    const svg2 = d3.select("#map2");
    const tooltip2 = d3.select("#tooltip2");

    Promise.all([
        d3.json('us-states.geojson'),
        d3.json('2008_data.json'),
        d3.json('2022_data.json')
    ]).then(function([geojsonData, stateData,stateData2]) {
        geojsonData.features.forEach(feature => {
            const stateInfo = stateData[feature.properties.name];
            const stateInfo2 = stateData2[feature.properties.name];
            if (stateInfo) {
                feature.properties.going_to_california = +stateInfo.going_to_california;
                feature.properties.going_to_california2 = +stateInfo2.going_to_california;
                feature.properties.coming_from_california = +stateInfo.coming_from_california;
                feature.properties.coming_from_california2 = +stateInfo2.coming_from_california;
            }
        });

        const maxMigration = d3.max(geojsonData.features, d => Math.max(d.properties.going_to_california, d.properties.coming_from_california,d.properties.going_to_california2, d.properties.coming_from_california2 ));
        
        const colorScale = d3.scaleLinear()
            .domain([0, maxMigration])
            .range(["#3d3d3d", "#3d3d3d"]);
            const colorScale2 = d3.scaleLinear()
            .domain([0, maxMigration])
            .range(["#798894", "#798894"]);


        const strokeWidthScale = d3.scaleLinear()
            .domain([0, maxMigration])
            .range([1, 15]);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", +30)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Migration to and from California (2008)");
        svg.selectAll("path")
            .data(geojsonData.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => d.properties.name === "California" ? "#f2a724" : colorScale2(d.properties.going_to_california))
            .attr("stroke", "white")
            .attr("stroke-width", "2.5")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "#ff9ee7");
                tooltip
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 20) + "px")
                    .style("visibility", "visible")
                    .html(`State: ${d.properties.name}<br>Going to California: ${d3.format(',')(d.properties.going_to_california)}<br>Coming from California: ${d3.format(',')(d.properties.coming_from_california)}`);
            })
            .on("mousemove", function(event, d) {
                tooltip
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("fill", d.properties.name === "California" ? "#f2a724" : colorScale2(d.properties.going_to_california));
                tooltip.style("visibility", "hidden");
            });

        svg.append("defs").append("marker")
            .attr("id", "arrowhead-green")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 5)
            .attr("refY", 5)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 Z")
            .attr("fill", "#45d985");
        

        svg.append("defs").append("marker")
            .attr("id", "arrowhead-red")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 5)
            .attr("refY", 5)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 Z")
            .attr("fill", "#bd2300");

        const centroids = geojsonData.features.map(feature => {
            const centroid = path.centroid(feature);
            return {
                name: feature.properties.name,
                centroid: centroid,
                going_to_california: feature.properties.going_to_california,
                coming_from_california: feature.properties.coming_from_california
            };
        });


        const backfilteredCentroids = centroids.filter(d => d.going_to_california - d.coming_from_california > 4500 && d.name !== "California");


        const filteredCentroids = centroids.filter(d => d.going_to_california - d.coming_from_california < -10000 && d.name !== "California");

        const californiaCentroid = centroids.find(d => d.name === "California").centroid;
        

        function generateCurvePath(source, target) {
            const dx = target[0] - source[0];
            const dy = target[1] - source[1];
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; 
            return `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]}`;
        }
        function generateCurvePath_2(source, target) {
            const dx = target[0] - source[0];
            const dy = target[1] - source[1] + 100;
            const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; 
            return `M${source[0]},${source[1]}A${dr},${dr} 0 0,1 ${target[0]},${target[1]+15}`;
        }
        const legendWidth = 120;
const legendHeight = 300;
const legendX = 680;
const legendY = 300;


        svg.selectAll("path.to")
            .data(filteredCentroids)
            .enter()
            .append("path")
            .attr("class", "to")
            .attr("d", d => generateCurvePath(californiaCentroid, d.centroid))
            .attr("stroke", "#bd2300")
            .attr("stroke-width", d => strokeWidthScale(d.going_to_california)*1.5)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrowhead-red)");
            svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("fill", "#ffffff")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1);

svg.append("text")
    .attr("x", legendX + legendWidth/4)
    .attr("y", legendY + 15)
    .text("Legend")
    .attr("font-weight", "bold");

svg.append("line")
    .attr("x1", legendX +110)
    .attr("y1", legendY + 55)
    .attr("x2", legendX + 75)
    .attr("y2", legendY + 55)
    .attr("stroke", "green")
    .attr("stroke-width", 3)
    .attr("marker-end", "url(#arrowHead)");

    svg.append("defs").append("marker")
    .attr("id", "arrowHead")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 8)
    .attr("refY", 5)
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 Z")
    .attr("fill", "green");

svg.append("line")
    .attr("x1", legendX +75)
    .attr("y1", legendY + 120)
    .attr("x2", legendX + 110)
    .attr("y2", legendY + 120)
    .attr("stroke", "red")
    .attr("stroke-width", 3)
    .attr("marker-end", "url(#arrowHead1)");



    svg.append("defs").append("marker")
    .attr("id", "arrowHead1")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 8)
    .attr("refY", 5)
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 Z")
    .attr("fill", "red");

svg.append("text")
    .attr("x", legendX +5 )
    .attr("y", legendY + 60)
    .text("California")
    .attr("font-size", "14px");
svg.append("text")
    .attr("x", legendX +5 )
    .attr("y", legendY + 125)
    .text("California")
    .attr("font-size", "14px");
svg.append("text")
    .attr("x", legendX+2)
    .attr("y", legendY + 80)
    .text(">4500 Net Migration")
    .attr("font-size", "12px");
    svg.append("text")
    .attr("x", legendX+2)
    .attr("y", legendY + 145)
    .text(">10000 Net Migration")
    .attr("font-size", "12px");
        svg.selectAll("path.from")
            .data(backfilteredCentroids)
            .enter()
            .append("path")
            .attr("class", "from")
            .attr("d", d => generateCurvePath_2(d.centroid, californiaCentroid))
            .attr("stroke", "#45d985")
            .attr("stroke-width", d => strokeWidthScale(d.coming_from_california)*1.5)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrowhead-green)");
 
        svg2.selectAll("path")
            .data(geojsonData.features)
            .enter()
            .append("path")
            .attr("d", path2)
            .attr("fill", d => d.properties.name === "California" ? "#f2a724" : colorScale(d.properties.going_to_california2))
            .attr("stroke", "white")
            .attr("stroke-width", "2.5")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "#ff9ee7");
                tooltip2
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 20) + "px")
                    .style("visibility", "visible")
                    .html(`State: ${d.properties.name}<br>Going to California: ${d.properties.going_to_california2}<br>Coming from California: ${d.properties.coming_from_california2}`);
            })
            .on("mousemove", function(event, d) {
                tooltip2
                    .style("left", (event.pageX + 20) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("fill", d.properties.name === "California" ? "#f2a724=" : colorScale(d.properties.going_to_california2));
                tooltip2.style("visibility", "hidden");
            });
            svg2.append("text")
            .attr("x", width / 2)
            .attr("y", +30)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Migration to and from California (2022)");
            


        svg2.append("defs").append("marker")
            .attr("id", "arrowhead-green")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 5)
            .attr("refY", 5)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 Z")
            .attr("fill", "#45d985");

        svg2.append("defs").append("marker")
            .attr("id", "arrowhead-red")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 5)
            .attr("refY", 5)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 Z")
            .attr("fill", "#bd2300");
            svg2.append("rect")
            .attr("x", legendX)
            .attr("y", legendY)
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .attr("fill", "#ffffff")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1);
        
        svg2.append("text")
            .attr("x", legendX + legendWidth/4)
            .attr("y", legendY + 15)
            .text("Legend")
            .attr("font-weight", "bold");
        
        svg2.append("line")
            .attr("x1", legendX +110)
            .attr("y1", legendY + 55)
            .attr("x2", legendX + 75)
            .attr("y2", legendY + 55)
            .attr("stroke", "green")
            .attr("stroke-width", 3)
            .attr("marker-end", "url(#arrowHead)");
        
            svg2.append("defs").append("marker")
            .attr("id", "arrowHead")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 8)
            .attr("refY", 5)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 Z")
            .attr("fill", "green");
        
        svg2.append("line")
            .attr("x1", legendX +75)
            .attr("y1", legendY + 120)
            .attr("x2", legendX + 110)
            .attr("y2", legendY + 120)
            .attr("stroke", "red")
            .attr("stroke-width", 3)
            .attr("marker-end", "url(#arrowHead1)");
        
        
        
            svg2.append("defs").append("marker")
            .attr("id", "arrowHead1")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 8)
            .attr("refY", 5)
            .attr("markerWidth", 4)
            .attr("markerHeight", 4)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 Z")
            .attr("fill", "red");
        
        svg2.append("text")
            .attr("x", legendX +5 )
            .attr("y", legendY + 60)
            .text("California")
            .attr("font-size", "14px");
        svg2.append("text")
            .attr("x", legendX +5 )
            .attr("y", legendY + 125)
            .text("California")
            .attr("font-size", "14px");
        svg2.append("text")
            .attr("x", legendX+2)
            .attr("y", legendY + 80)
            .text(">4500 Net Migration")
            .attr("font-size", "12px");
            svg2.append("text")
            .attr("x", legendX+2)
            .attr("y", legendY + 145)
            .text(">10000 Net Migration")
            .attr("font-size", "12px");

        const centroids2 = geojsonData.features.map(feature => {
            const centroid2 = path2.centroid(feature);
            return {
                name: feature.properties.name,
                centroid: centroid2,
                going_to_california2: feature.properties.going_to_california2,
                coming_from_california2: feature.properties.coming_from_california2
            };
        });

        const backfilteredCentroids2 = centroids2.filter(d => d.going_to_california2 - d.coming_from_california2 > 4500 && d.name !== "California");

        const filteredCentroids2 = centroids2.filter(d => d.going_to_california2 - d.coming_from_california2 < -10000 && d.name !== "California");

        const californiaCentroid2 = centroids2.find(d => d.name === "California").centroid;
        


        svg2.selectAll("path.to")
            .data(filteredCentroids2)
            .enter()
            .append("path")
            .attr("class", "to")
            .attr("d", d => generateCurvePath(californiaCentroid2, d.centroid))
            .attr("stroke", "#bd2300")
            .attr("stroke-width", d => strokeWidthScale(d.going_to_california2)*1.5)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrowhead-red)");

        svg2.selectAll("path.from")
            .data(backfilteredCentroids2)
            .enter()
            .append("path")
            .attr("class", "from")
            .attr("d", d => generateCurvePath_2(d.centroid, californiaCentroid2))
            .attr("stroke", "#45d985")
            .attr("stroke-width", d => strokeWidthScale(d.coming_from_california2)*1.5)
            .attr("fill", "none")
            .attr("marker-end", "url(#arrowhead-green)");

        
    });
    const svgImageContainer = d3.select('#image-svg')
        .attr('width', 250)
        .attr('height', 250)
        .attr('transform','translate(100,0)');
    
    

    svgImageContainer.append('image')
    .attr('xlink:href', 'house.jpg')
    .attr('width', 250)
    .attr('height', 250)
    .on('mouseover', function() {
        d3.select('#bar-chart').style('opacity', 1);
        d3.select('#image-svg').style('opacity', 0);
    })
    .on('mouseout', function() {
        d3.select('#bar-chart').style('opacity', 0);
        d3.select('#image-svg').style('opacity', 1);
    });

        
    


d3.csv('h_price.csv').then(function(data) {
    data.forEach(d => d.price = +d.price);

    data.sort((a, b) => b.price - a.price);
    
    const topTenStates = data.slice(0, 10);
    
    const xScale = d3.scaleBand()
        .domain(topTenStates.map(d => d.state))
        .range([60, 400]) 
        .padding(0.1);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(topTenStates, d => d.price)])
        .range([400, 40]); 
    
    const svg = d3.select('#bar-chart')
        .attr('width', 500)
        .attr('height', 500)
        .attr('transform','translate(200,-100)');
    
    svg.selectAll('.bar')
        .data(topTenStates)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.state))
        .attr('y', d => yScale(d.price))
        .attr('width', xScale.bandwidth())
        .attr('height', d => 400 - yScale(d.price))
        .attr('fill', d => d.state === 'California' ? 'red' : 'steelblue');
    
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, 400)`) 
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .attr('x', -10)
        .attr('y', 0);
    
    svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(60, 0)`) 
        .call(d3.axisLeft(yScale));

    svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', 230)
        .attr('y', 460)
        .attr('text-anchor', 'middle')
        .text('State');

    svg.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -230)
        .attr('y', 11)
        .attr('text-anchor', 'middle')
        .text('Average Housing Price');
});






        


          
    





    



    const svgImageContainer1 = d3.select('#svg-image-container1')
        .attr('width', 250)
        .attr('height', 250)
        .attr('transform','translate(100,0)');

    svgImageContainer1.append('image')
        .attr('xlink:href', 'tax.jpg') 
        .attr('width', 250)
        .attr('height', 250) 
        .attr('y', +1)
        
        .on('mouseover', function() {
            d3.select('#bar-chart2').style('opacity', 1);
            d3.select('#svg-image-container1').style('opacity', 0);
        })
        .on('mouseout', function() {
            d3.select('#bar-chart2').style('opacity', 0);
            d3.select('#svg-image-container1').style('opacity', 1);
        });
    
    
d3.csv('taxes.csv').then(function(data) {
    data.sort((a, b) => parseFloat(b.IncomeTaxRate) - parseFloat(a.IncomeTaxRate));

    const topTenStates = data.slice(0, 10);

    const xScale = d3.scaleBand()
        .domain(topTenStates.map(d => d.State))
        .range([60, 400])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(topTenStates, d => parseFloat(d.IncomeTaxRate))])
        .range([400, 40]); 

    const svg = d3.select('#bar-chart2').attr('transform','translate(200,-100)');

    const bars = svg.selectAll('.bar')
        .data(topTenStates)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.State))
        .attr('y', d => yScale(parseFloat(d.IncomeTaxRate)))
        .attr('width', xScale.bandwidth())
        .attr('height', d => 400 - yScale(parseFloat(d.IncomeTaxRate)))
        .attr('fill', d => d.State === 'California' ? 'red' : 'steelblue');

    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, 400)`) 
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .attr('x', -10)
        .attr('y', 0);

    svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(60, 0)`) 
        .call(d3.axisLeft(yScale));

    svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', 230)
        .attr('y', 460)
        .attr('text-anchor', 'middle')
        .text('State');

    svg.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -230)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Income Tax Rate');

    bars.append('text')
        .attr('class', 'bar-label')
        .attr('x', d => xScale(d.State) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(parseFloat(d.IncomeTaxRate)) - 5)
        .attr('text-anchor', 'middle')
        .text(d => parseFloat(d.IncomeTaxRate).toFixed(2)); 
});







    
    















    const svgImageContainer2 = d3.select('#svg-image-container2')
        .attr('width', 250)
        .attr('height', 250)
        .attr('transform','translate(100,0)');

    svgImageContainer2.append('image')
        .attr('xlink:href', 'job.jpg') 
        .attr('width', 250)
        .attr('height', 250)
        .on('mouseover', function() {
            d3.select('#bar-chart3').style('opacity', 1);
            d3.select('#svg-image-container2').style('opacity', 0);
        })
        .on('mouseout', function() {
            d3.select('#bar-chart3').style('opacity', 0);
            d3.select('#svg-image-container2').style('opacity', 1);
        });


d3.csv('job.csv').then(function(data) {
    data.sort((a, b) => parseFloat(b['Percent Job Growth']) - parseFloat(a['Percent Job Growth']));

    const topTenStates = data.slice(0, 10);

    const xScale = d3.scaleBand()
        .domain(topTenStates.map(d => d.State))
        .range([60, 400])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(topTenStates, d => parseFloat(d['Percent Job Growth']))])
        .range([400, 40]); 

    const svg = d3.select('#bar-chart3').attr('transform','translate(200,-100)');

    const bars = svg.selectAll('.bar')
        .data(topTenStates)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.State))
        .attr('y', d => yScale(parseFloat(d['Percent Job Growth'])))
        .attr('width', xScale.bandwidth())
        .attr('height', d => 400 - yScale(parseFloat(d['Percent Job Growth'])))
        .attr('fill', d => {
            if (d.State === 'California') return 'red';
            else if (d.State === 'Florida') return 'green';
            else if (d.State === 'Texas') return 'orange';
            else return 'steelblue';
        });


    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, 400)`) 
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .attr('text-anchor', 'end')
        .attr('x', -10)
        .attr('y', 0);

    svg.append('g')
        .attr('class', 'y-axis')
        .attr('transform', `translate(60, 0)`) 
        .call(d3.axisLeft(yScale));

    svg.append('text')
        .attr('class', 'x-axis-label')
        .attr('x', 230)
        .attr('y', 465)
        .attr('text-anchor', 'middle')
        .text('State');

    svg.append('text')
        .attr('class', 'y-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -230)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .text('Percent Job Growth');

    bars.append('text')
        .attr('class', 'bar-label')
        .attr('x', d => xScale(d.State) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(parseFloat(d['Percent Job Growth'])) - 5)
        .attr('text-anchor', 'middle')
        .text(d => parseFloat(d['Percent Job Growth']).toFixed(2)); 
});

        
        



});
