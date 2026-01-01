import nextra from 'nextra'
import workflowNext from 'workflow/next'

const withNextra = nextra({
  latex: true
  // Use content/ directory for blog posts
})

const { withWorkflow } = workflowNext

export default withWorkflow(
  withNextra({
    // Force webpack build worker off to help with workflow loader timing
    experimental: {
      webpackBuildWorker: false
    }
  })
)
