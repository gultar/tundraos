
const initParticles = () =>{
    
    const particles =  Particles.init({
    selector:'.background',
    connectParticles: true,
    color: '#48F2E3',
    
// options for breakpoints
    responsive: [{
                breakpoint: 768,
                options: {
                    maxParticles: 100,
                    color: '#48F2E3',
                    connectParticles: true
                }
            }, 
            {
                breakpoint: 425,
                options: {
                    maxParticles: 50,
                    connectParticles: true
                }
            }, 
            {
                breakpoint: 320,
                options: {
                    maxParticles: 0
                }
        }]
    });
    window.particles = particles
    
}



