import type { QuizSet } from '../types'

export const SETS: QuizSet[] = [
  {
    id: 'set-01-resilient-architectures',
    name: 'Resilient Architectures',
    description: 'Multi-AZ, Auto Scaling, Route 53, RDS, S3 replication, SQS/SNS, ElastiCache',
    domain: 'Resilient Architectures',
    questionCount: 65,
  },
  {
    id: 'set-02-secure-architectures',
    name: 'Secure Architectures',
    description: 'IAM, STS, SCPs, VPC security, KMS, Secrets Manager, WAF, Shield, Cognito',
    domain: 'Secure Architectures',
    questionCount: 65,
  },
  {
    id: 'set-03-high-performing-architectures',
    name: 'High-Performing Architectures',
    description: 'EC2 families, Lambda, API Gateway, DynamoDB DAX, CloudFront, Kinesis',
    domain: 'High-Performing Architectures',
    questionCount: 65,
  },
  {
    id: 'set-04-cost-optimized-architectures',
    name: 'Cost-Optimized Architectures',
    description: 'Spot, Reserved, Savings Plans, S3 tiers, EBS types, NAT Gateway costs',
    domain: 'Cost-Optimized Architectures',
    questionCount: 65,
  },
  {
    id: 'set-05-storage-and-databases',
    name: 'Storage & Databases',
    description: 'S3 advanced, EFS, Storage Gateway, Snow family, RDS, DynamoDB, Redshift',
    domain: 'Resilient Architectures',
    questionCount: 65,
  },
  {
    id: 'set-06-networking-and-connectivity',
    name: 'Networking & Connectivity',
    description: 'VPC design, Transit Gateway, Direct Connect, Route 53, ALB/NLB, CloudFront',
    domain: 'Resilient Architectures',
    questionCount: 65,
  },
  {
    id: 'set-07-exam-simulation-1',
    name: 'Exam Simulation 1',
    description: '65 mixed questions across all 4 domains — timed exam mode',
    domain: 'Mixed',
    questionCount: 65,
  },
  {
    id: 'set-08-exam-simulation-2',
    name: 'Exam Simulation 2',
    description: '65 mixed questions across all 4 domains — timed exam mode',
    domain: 'Mixed',
    questionCount: 65,
  },
  {
    id: 'set-09-specialized-services',
    name: 'Specialized Services & Migration',
    description: 'Glue, Lake Formation, MSK, DMS, DataSync, EventBridge, Step Functions, MQ, AppSync, CloudHSM, Detective, Wavelength',
    domain: 'Mixed',
    questionCount: 55,
  },
]

export const DOMAIN_COLORS: Record<string, string> = {
  'Resilient Architectures': 'bg-sky-900 text-sky-300 border-sky-700',
  'High-Performing Architectures': 'bg-violet-900 text-violet-300 border-violet-700',
  'Secure Architectures': 'bg-amber-900 text-amber-300 border-amber-700',
  'Cost-Optimized Architectures': 'bg-emerald-900 text-emerald-300 border-emerald-700',
  Mixed: 'bg-gray-800 text-gray-300 border-gray-600',
}
