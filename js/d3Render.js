// main program
const svgWidth = 960 ;
const svgHeight = 600;

const title = d3.select("body")
                .append("h1")
                .attr("id", "title")
                .text("United States Educational Attainment");

const description = d3.select("body")
                      .append("p")
                      .attr("id", "description")
                      .text("Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)");

const svg = d3.select("body")
              .append("svg")
              .attr("width", svgWidth)
              .attr("height", svgHeight);

const tooltip = d3.select("body")
                  .append("div")
                  .attr("id", "tooltip")
                  .style("opacity", 0);

const legend = svg.append("g")
                 .attr("id", "legend")
                 .attr("translate", "transform(0, 40)");

const source = d3.select("body")
                 .append("div")
                 .attr("id", "source");

const linkPrefix = source.append("span")
                         .text("Source: ");

const link = source.append('a')
                   .text('USDA Economic Research Service')
                   .attr('href', 'https://www.ers.usda.gov/data-products/county-level-data-sets/download-data.aspx')
                   .attr('target', '_blank');

const footer = d3.select("body")
                 .append("footer");

const footerTextPrefix = footer.append("p")
                               .text('Designed and ');

const footerIcon = footerTextPrefix.append("span")
                                   .attr("class", "fas fa-code");

const footerSuffixPrefix = footerIcon.append("span")
                                     .text(" by Sergio Barbosa");           
                 


const path = d3.geoPath();


const COUNTY_URL = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';
const EDUCATION_URL = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';

let promises = [
    d3.json(COUNTY_URL),
    d3.json(EDUCATION_URL)
    ];

    Promise.all(promises).then(([us, education]) => { 

        let bachelorsDegree = education.map((element) => {
            return element.bachelorsOrHigher;
        });
        
        const startRange = d3.extent(bachelorsDegree)[0];
        const endRange = d3.extent(bachelorsDegree)[1];
        const numberColors = 8;

        const colorDomain = d3.range(startRange, endRange, ((endRange - startRange) / numberColors));

        const color = d3.scaleThreshold()
                        .domain(colorDomain)
                        .range(d3.schemeGreens[numberColors + 1]);

        
        const x = d3.scaleLinear()
                    .domain([startRange, endRange])
                    .rangeRound([600, 860]);

        const legendColors = legend.selectAll("rect")
                                   .data(color.range().map((d) => {
                                            d = color.invertExtent(d);
                                            if (d[0] == null) d[0] = x.domain()[0];
                                            if (d[1] == null) d[1] = x.domain()[1];
                                            return d; 
                                    }))
                                    .enter()
                                    .append("rect")
                                    .attr("height", 8)
                                    .attr("width", (d) => { return x(d[1]) - x(d[0]); })
                                    .attr("x", (d) => { return x(d[0]); })
                                    .attr("fill", (d) => { return color(d[0]); });

        const legendCaption = legend.append("text")
                                    .attr("class", "caption")
                                    .attr("x", x.range()[0])
                                    .attr("y", -6)
                                    .attr("fill", "black")
                                    .attr("text-anchor", "start")
                                    .attr("font-weight", "bold");

        const legendFormat =  legend.call(d3.axisBottom(x)
                                    .tickSize(13)
                                    .tickFormat(function(x) { return Math.round(x) + '%' })
                                    .tickValues(color.domain()))
                                    .select(".domain")
                                    .remove();

        
        let topojsonObject = topojson.feature(us, us.objects.counties);
        let topojsonDataSet = topojsonObject.features; // Mathematical representation of the map

        // Filter education results based on us values
        const filterEducationById = (id) => {
            return education.filter(ed => ed.fips === id);
        }

        // Draw the map
        svg.append("g")
           .attr("class", "counties")
           .selectAll("path")
           .data(topojsonDataSet)
           .enter()
           .append("path")
           .attr("class", "county")
           .attr("data-fips", (d) => {
               let educationFiltered = filterEducationById(d.id);
               return educationFiltered[0].fips;
           })
           .attr("data-education", (d) => {
            let educationFiltered = filterEducationById(d.id);
            return educationFiltered[0].bachelorsOrHigher;
           })
           .style("fill", d => {
            let educationFiltered = filterEducationById(d.id);
            return color(educationFiltered[0].bachelorsOrHigher);
           })
           .attr("d", d3.geoPath())
           .on("mouseover", (d, i) => {
                let educationFiltered = filterEducationById(d.id);

                tooltip.transition()
                       .duration(300)
                       .style("opacity", 0.90);
                tooltip.html(`<p>${educationFiltered[0].area_name}, ${educationFiltered[0].state}: ${educationFiltered[0].bachelorsOrHigher}%</p>`)
                       .style("left", (d3.event.pageX + 15) + "px")
                       .style("top", (d3.event.pageY - 50) + "px")
                tooltip.attr("data-education", educationFiltered[0].bachelorsOrHigher);
            })
            .on("mouseout", () => {
                 tooltip.transition()
                        .duration(300)
                        .style("opacity", 0);
            });

        // Draw the state borders
        const statesBorders = svg.append("path")
            .datum(topojson.mesh(us, us.objects.states), (a, b) => a !== b)
            .attr("class", "states")
            .attr("d", d3.geoPath());
        

    }).catch(error => {
        console.log(error);
    });